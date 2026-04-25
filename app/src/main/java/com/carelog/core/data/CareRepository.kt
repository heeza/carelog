package com.carelog.core.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.carelog.core.local.CareLocalDao
import com.carelog.core.local.EmergencyEntity
import com.carelog.core.local.LogEntity
import com.carelog.core.local.SyncState
import com.carelog.core.model.CareLog
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.Emergency
import com.carelog.core.model.EmergencyStatus
import com.carelog.core.model.EmergencyType
import com.carelog.core.model.IssueType
import com.carelog.core.model.MealStatus
import com.carelog.core.model.MedicationStatus
import com.carelog.core.model.TimelineItem
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.decodeList
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgres.PostgresAction
import io.github.jan.supabase.realtime.postgresChangeFlow
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

enum class SupabaseConnectionState {
    UNAVAILABLE,
    OFFLINE,
    CONNECTING,
    CONNECTED,
    ERROR,
}

interface CareRepository {
    val activeEmergency: StateFlow<Emergency?>
    val connectionState: StateFlow<SupabaseConnectionState>
    fun observeLogs(circleId: String): Flow<List<CareLog>>
    fun observeTimeline(circleId: String): Flow<List<TimelineItem>>
    suspend fun saveLog(
        circleId: String,
        authorId: String,
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String
    ): Result<CareLog>

    suspend fun triggerEmergency(
        circleId: String,
        authorId: String,
        type: EmergencyType,
        note: String
    ): Result<Emergency>

    suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit>
    suspend fun syncPendingWrites(): Result<Unit>
    fun schedulePendingSync()
    suspend fun requestEmergencySmsFallback(emergencyId: String): Result<Unit>
}

@Singleton
class SupabaseCareRepository @Inject constructor(
    private val supabaseClient: SupabaseClient?,
    private val localDao: CareLocalDao,
    private val workManager: WorkManager,
    @ApplicationContext private val context: Context,
) : CareRepository {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val subscribedCircles = mutableSetOf<String>()

    private val _activeEmergency = MutableStateFlow<Emergency?>(null)
    override val activeEmergency: StateFlow<Emergency?> = _activeEmergency.asStateFlow()

    private val _connectionState = MutableStateFlow(
        if (supabaseClient == null) SupabaseConnectionState.UNAVAILABLE else SupabaseConnectionState.OFFLINE
    )
    override val connectionState: StateFlow<SupabaseConnectionState> = _connectionState.asStateFlow()

    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    init {
        monitorConnectivity()
    }

    override fun observeLogs(circleId: String): Flow<List<CareLog>> {
        ensureRealtime(circleId)
        scope.launch { refreshCircle(circleId) }
        return localDao.observeLogs(circleId).map { entities -> entities.map { it.toDomain() } }
    }

    override fun observeTimeline(circleId: String): Flow<List<TimelineItem>> {
        ensureRealtime(circleId)
        scope.launch { refreshCircle(circleId) }
        return combine(
            localDao.observeLogs(circleId),
            localDao.observeEmergencies(circleId)
        ) { logs, emergencies ->
            buildList {
                logs.forEach { add(TimelineItem(log = it.toDomain())) }
                emergencies.forEach { add(TimelineItem(emergency = it.toDomain())) }
            }.sortedByDescending { it.log?.occurredAt ?: it.emergency?.triggeredAt }
        }
    }

    override suspend fun saveLog(
        circleId: String,
        authorId: String,
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String,
    ): Result<CareLog> {
        val created = CareLog(
            circleId = circleId,
            authorId = authorId,
            meal = meal,
            medication = medication,
            condition = condition,
            issue = issue,
            note = note,
        )
        localDao.upsertLog(created.toEntity(syncState = SyncState.PENDING))
        schedulePendingSync()
        scope.launch { syncPendingWrites() }
        return Result.success(created)
    }

    override suspend fun triggerEmergency(
        circleId: String,
        authorId: String,
        type: EmergencyType,
        note: String,
    ): Result<Emergency> {
        val created = Emergency(
            circleId = circleId,
            triggeredBy = authorId,
            type = type,
            note = note,
            status = EmergencyStatus.ACTIVE,
        )
        localDao.upsertEmergency(created.toEntity(syncState = SyncState.PENDING))
        _activeEmergency.value = created
        schedulePendingSync()
        scope.launch { syncPendingWrites() }
        return Result.success(created)
    }

    override suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit> {
        localDao.acknowledgeEmergency(
            id = emergencyId,
            status = EmergencyStatus.ACKNOWLEDGED.toDbValue(),
            acknowledgedAtEpochMillis = Clock.System.now().toEpochMilliseconds(),
            syncState = SyncState.PENDING.name,
        )
        val active = _activeEmergency.value
        if (active?.id == emergencyId) {
            _activeEmergency.value = active.copy(status = EmergencyStatus.ACKNOWLEDGED)
        }
        schedulePendingSync()
        scope.launch { syncPendingWrites() }
        return Result.success(Unit)
    }

    override suspend fun syncPendingWrites(): Result<Unit> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException(Supabase
