package com.carelog.core.model

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import java.util.UUID

enum class UserRole { CAREGIVER, GUARDIAN }

enum class MealStatus { COMPLETED, PARTIAL, MISSED }
enum class MedicationStatus { COMPLETED, MISSED }
enum class ConditionStatus { GOOD, NORMAL, BAD }
enum class IssueType { NONE, DIZZINESS, PAIN, LOW_APPETITE, OTHER }
enum class EmergencyType { UNCONSCIOUS, FALL, BREATHING, PAIN, OTHER }
enum class EmergencyStatus { ACTIVE, ACKNOWLEDGED, RESOLVED }

data class UserSession(
    val userId: String,
    val phone: String,
    val role: UserRole? = null,
    val circleId: String? = null,
    val circleInviteCode: String? = null,
)

data class CareLog(
    val id: String = UUID.randomUUID().toString(),
    val circleId: String,
    val authorId: String,
    val occurredAt: Instant = Clock.System.now(),
    val meal: MealStatus,
    val medication: MedicationStatus,
    val condition: ConditionStatus,
    val issue: IssueType,
    val note: String = ""
)

data class Emergency(
    val id: String = UUID.randomUUID().toString(),
    val circleId: String,
    val triggeredBy: String,
    val triggeredAt: Instant = Clock.System.now(),
    val type: EmergencyType,
    val note: String = "",
    val status: EmergencyStatus = EmergencyStatus.ACTIVE
)

data class TimelineItem(
    val log: CareLog? = null,
    val emergency: Emergency? = null
)
