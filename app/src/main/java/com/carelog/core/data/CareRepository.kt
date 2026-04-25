package com.carelog.core.data

import com.carelog.core.model.CareLog
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.Emergency
import com.carelog.core.model.EmergencyStatus
import com.carelog.core.model.EmergencyType
import com.carelog.core.model.IssueType
import com.carelog.core.model.MealStatus
import com.carelog.core.model.MedicationStatus
import com.carelog.core.model.TimelineItem
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgres.PostgresAction
import io.github.jan.supabase.realtime.postgresChangeFlow
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

interface CareRepository {
    val activeEmergency: StateFlow<Emergency?>
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
}

@Singleton
class SupabaseCareRepository @Inject constructor(
    private val supabaseClient: SupabaseClient?
) : CareRepository {
    private val logsFlow = MutableStateFlow<List<CareLog>>(emptyList())
    private val emergenciesFlow = MutableStateFlow<List<Emergency>>(emptyList())
    private val _activeEmergency = MutableStateFlow<Emergency?>(null)
    override val activeEmergency: StateFlow<Emergency?> = _activeEmergency.asStateFlow()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val subscribedCircles = mutableSetOf<String>()

    override fun observeLogs(circleId: String): Flow<List<CareLog>> =
        logsFlow
            .map { logs -> logs.filter { it.circleId == circleId } }
            .onStart {
                ensureRealtime(circleId)
                refreshCircle(circleId)
            }

    override fun observeTimeline(circleId: String): Flow<List<TimelineItem>> = combine(
        logsFlow,
        emergenciesFlow
    ) { logs, emergencies ->
        val timeline = buildList {
            logs.filter { it.circleId == circleId }.forEach { add(TimelineItem(log = it)) }
            emergencies.filter { it.circleId == circleId }.forEach { add(TimelineItem(emergency = it)) }
        }
        timeline.sortedByDescending { it.log?.occurredAt ?: it.emergency?.triggeredAt }
    }.onStart {
        ensureRealtime(circleId)
        refreshCircle(circleId)
    }

    override suspend fun saveLog(
        circleId: String,
        authorId: String,
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String
    ): Result<CareLog> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        return runCatching {
            val row = client.from("logs").insert(
                buildJsonObject {
                    put("circle_id", circleId)
                    put("author_id", authorId)
                    put("meal", meal.toDbValue())
                    put("medication", medication.toDbValue())
                    put("condition", condition.toDbValue())
                    put("issue", issue.toDbValue())
                    put("note", note)
                }
            ) {
                select()
            }.decodeSingle<JsonObject>()

            refreshCircle(circleId)
            row.toCareLog()
        }
    }

    override suspend fun triggerEmergency(
        circleId: String,
        authorId: String,
        type: EmergencyType,
        note: String
    ): Result<Emergency> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        return runCatching {
            val row = client.from("emergencies").insert(
                buildJsonObject {
                    put("circle_id", circleId)
                    put("triggered_by", authorId)
                    put("type", type.toDbValue())
                    put("note", note)
                }
            ) {
                select()
            }.decodeSingle<JsonObject>()

            refreshCircle(circleId)
            row.toEmergency()
        }
    }

    override suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        return runCatching {
            val updated = client.from("emergencies").update(
                buildJsonObject {
                    put("status", EmergencyStatus.ACKNOWLEDGED.toDbValue())
                    put("acknowledged_at", Clock.System.now().toString())
                }
            ) {
                select()
                filter { eq("id", emergencyId) }
            }.decodeList<JsonObject>()

            val circleId = updated.firstOrNull()?.requiredString("circle_id")
            if (circleId != null) {
                refreshCircle(circleId)
            } else {
                val active = emergenciesFlow.value.firstOrNull { it.status == EmergencyStatus.ACTIVE }
                _activeEmergency.value = active
            }
            Unit
        }
    }

    private suspend fun refreshCircle(circleId: String) {
        val client = supabaseClient ?: return
        val logs = client.from("logs").select {
            filter { eq("circle_id", circleId) }
        }.decodeList<JsonObject>().map { it.toCareLog() }

        val emergencies = client.from("emergencies").select {
            filter { eq("circle_id", circleId) }
        }.decodeList<JsonObject>().map { it.toEmergency() }

        logsFlow.value = (logsFlow.value.filterNot { it.circleId == circleId } + logs)
            .sortedByDescending { it.occurredAt }
        emergenciesFlow.value = (emergenciesFlow.value.filterNot { it.circleId == circleId } + emergencies)
            .sortedByDescending { it.triggeredAt }
        _activeEmergency.value = emergenciesFlow.value.firstOrNull { it.status == EmergencyStatus.ACTIVE }
    }

    private fun ensureRealtime(circleId: String) {
        val client = supabaseClient ?: return
        if (!subscribedCircles.add(circleId)) return

        scope.launch {
            val channel = client.channel("circle-$circleId")

            val logsChanges = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "logs"
            }
            val emergencyChanges = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "emergencies"
            }

            channel.subscribe(blockUntilSubscribed = true)

            launch {
                logsChanges.collect { refreshCircle(circleId) }
            }
            launch {
                emergencyChanges.collect { refreshCircle(circleId) }
            }
        }
    }

    private fun JsonObject.toCareLog(): CareLog {
        return CareLog(
            id = requiredString("id") ?: "",
            circleId = requiredString("circle_id") ?: "",
            authorId = requiredString("author_id") ?: "",
            occurredAt = requiredString("occurred_at").toInstantOrNow(),
            meal = requiredString("meal").toMealStatus(),
            medication = requiredString("medication").toMedicationStatus(),
            condition = requiredString("condition").toConditionStatus(),
            issue = requiredString("issue").toIssueType(),
            note = requiredString("note").orEmpty(),
        )
    }

    private fun JsonObject.toEmergency(): Emergency {
        return Emergency(
            id = requiredString("id") ?: "",
            circleId = requiredString("circle_id") ?: "",
            triggeredBy = requiredString("triggered_by") ?: "",
            triggeredAt = requiredString("triggered_at").toInstantOrNow(),
            type = requiredString("type").toEmergencyType(),
            note = requiredString("note").orEmpty(),
            status = requiredString("status").toEmergencyStatus(),
        )
    }

    private fun JsonObject.requiredString(key: String): String? = this[key]?.jsonPrimitive?.content

    private fun String?.toInstantOrNow(): Instant = runCatching {
        if (this == null) Clock.System.now() else Instant.parse(this)
    }.getOrElse { Clock.System.now() }

    private fun String?.toMealStatus(): MealStatus = when (this?.lowercase()) {
        "partial" -> MealStatus.PARTIAL
        "missed" -> MealStatus.MISSED
        else -> MealStatus.COMPLETED
    }

    private fun String?.toMedicationStatus(): MedicationStatus = when (this?.lowercase()) {
        "missed" -> MedicationStatus.MISSED
        else -> MedicationStatus.COMPLETED
    }

    private fun String?.toConditionStatus(): ConditionStatus = when (this?.lowercase()) {
        "normal" -> ConditionStatus.NORMAL
        "bad" -> ConditionStatus.BAD
        else -> ConditionStatus.GOOD
    }

    private fun String?.toIssueType(): IssueType = when (this?.lowercase()) {
        "dizziness" -> IssueType.DIZZINESS
        "pain" -> IssueType.PAIN
        "low_appetite" -> IssueType.LOW_APPETITE
        "other" -> IssueType.OTHER
        else -> IssueType.NONE
    }

    private fun String?.toEmergencyType(): EmergencyType = when (this?.lowercase()) {
        "unconscious" -> EmergencyType.UNCONSCIOUS
        "breathing" -> EmergencyType.BREATHING
        "pain" -> EmergencyType.PAIN
        "other" -> EmergencyType.OTHER
        else -> EmergencyType.FALL
    }

    private fun String?.toEmergencyStatus(): EmergencyStatus = when (this?.lowercase()) {
        "acknowledged" -> EmergencyStatus.ACKNOWLEDGED
        "resolved" -> EmergencyStatus.RESOLVED
        else -> EmergencyStatus.ACTIVE
    }

    private fun MealStatus.toDbValue(): String = when (this) {
        MealStatus.COMPLETED -> "completed"
        MealStatus.PARTIAL -> "partial"
        MealStatus.MISSED -> "missed"
    }

    private fun MedicationStatus.toDbValue(): String = when (this) {
        MedicationStatus.COMPLETED -> "completed"
        MedicationStatus.MISSED -> "missed"
    }

    private fun ConditionStatus.toDbValue(): String = when (this) {
        ConditionStatus.GOOD -> "good"
        ConditionStatus.NORMAL -> "normal"
        ConditionStatus.BAD -> "bad"
    }

    private fun IssueType.toDbValue(): String = when (this) {
        IssueType.NONE -> "none"
        IssueType.DIZZINESS -> "dizziness"
        IssueType.PAIN -> "pain"
        IssueType.LOW_APPETITE -> "low_appetite"
        IssueType.OTHER -> "other"
    }

    private fun EmergencyType.toDbValue(): String = when (this) {
        EmergencyType.UNCONSCIOUS -> "unconscious"
        EmergencyType.FALL -> "fall"
        EmergencyType.BREATHING -> "breathing"
        EmergencyType.PAIN -> "pain"
        EmergencyType.OTHER -> "other"
    }

    private fun EmergencyStatus.toDbValue(): String = when (this) {
        EmergencyStatus.ACTIVE -> "active"
        EmergencyStatus.ACKNOWLEDGED -> "acknowledged"
        EmergencyStatus.RESOLVED -> "resolved"
    }
}
