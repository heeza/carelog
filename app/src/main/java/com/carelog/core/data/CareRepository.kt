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
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

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
class InMemoryCareRepository @Inject constructor() : CareRepository {
    private val logsFlow = MutableStateFlow<List<CareLog>>(emptyList())
    private val emergenciesFlow = MutableStateFlow<List<Emergency>>(emptyList())
    private val _activeEmergency = MutableStateFlow<Emergency?>(null)
    override val activeEmergency: StateFlow<Emergency?> = _activeEmergency.asStateFlow()

    override fun observeLogs(circleId: String): Flow<List<CareLog>> =
        logsFlow.map { logs -> logs.filter { it.circleId == circleId } }

    override fun observeTimeline(circleId: String): Flow<List<TimelineItem>> = combine(
        logsFlow,
        emergenciesFlow
    ) { logs, emergencies ->
        val timeline = buildList {
            logs.filter { it.circleId == circleId }.forEach { add(TimelineItem(log = it)) }
            emergencies.filter { it.circleId == circleId }.forEach { add(TimelineItem(emergency = it)) }
        }
        timeline.sortedByDescending { it.log?.occurredAt ?: it.emergency?.triggeredAt }
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
        val log = CareLog(
            id = UUID.randomUUID().toString(),
            circleId = circleId,
            authorId = authorId,
            meal = meal,
            medication = medication,
            condition = condition,
            issue = issue,
            note = note
        )
        logsFlow.value = listOf(log) + logsFlow.value
        return Result.success(log)
    }

    override suspend fun triggerEmergency(
        circleId: String,
        authorId: String,
        type: EmergencyType,
        note: String
    ): Result<Emergency> {
        val emergency = Emergency(
            id = UUID.randomUUID().toString(),
            circleId = circleId,
            triggeredBy = authorId,
            type = type,
            note = note,
            status = EmergencyStatus.ACTIVE
        )
        emergenciesFlow.value = listOf(emergency) + emergenciesFlow.value
        _activeEmergency.value = emergency
        return Result.success(emergency)
    }

    override suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit> {
        emergenciesFlow.value = emergenciesFlow.value.map {
            if (it.id == emergencyId) it.copy(status = EmergencyStatus.ACKNOWLEDGED) else it
        }
        _activeEmergency.value = emergenciesFlow.value.firstOrNull { it.status == EmergencyStatus.ACTIVE }
        return Result.success(Unit)
    }
}
