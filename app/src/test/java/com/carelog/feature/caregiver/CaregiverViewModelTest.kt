package com.carelog.feature.caregiver

import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.data.SupabaseConnectionState
import com.carelog.core.model.CareLog
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.Emergency
import com.carelog.core.model.EmergencyType
import com.carelog.core.model.IssueType
import com.carelog.core.model.MealStatus
import com.carelog.core.model.MedicationStatus
import com.carelog.core.model.TimelineItem
import com.carelog.core.model.UserRole
import com.carelog.core.model.UserSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CaregiverViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun saveLogSuccess_setsSaveCompleted() = runTest {
        val auth = FakeAuthRepositoryForCaregiver()
        val care = FakeCareRepositoryForCaregiver()
        val viewModel = CaregiverViewModel(auth, care)

        viewModel.saveLog(
            meal = MealStatus.COMPLETED,
            medication = MedicationStatus.COMPLETED,
            condition = ConditionStatus.GOOD,
            issue = IssueType.NONE,
            note = "ok"
        )
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.saveCompleted)
        assertEquals("저장 완료", viewModel.uiState.value.message)
    }

    @Test
    fun saveLogFailure_setsErrorMessage() = runTest {
        val auth = FakeAuthRepositoryForCaregiver()
        val care = FakeCareRepositoryForCaregiver(saveShouldFail = true)
        val viewModel = CaregiverViewModel(auth, care)

        viewModel.saveLog(
            meal = MealStatus.COMPLETED,
            medication = MedicationStatus.COMPLETED,
            condition = ConditionStatus.GOOD,
            issue = IssueType.NONE,
            note = "ok"
        )
        dispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.uiState.value.saveCompleted)
        assertEquals("save failed", viewModel.uiState.value.message)
    }

    @Test
    fun triggerEmergencySuccess_marksEmergencySent() = runTest {
        val auth = FakeAuthRepositoryForCaregiver()
        val care = FakeCareRepositoryForCaregiver()
        val viewModel = CaregiverViewModel(auth, care)

        viewModel.triggerEmergency(EmergencyType.FALL, "urgent")
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.emergencySent)
        assertFalse(viewModel.uiState.value.isEmergencySending)
    }

    @Test
    fun triggerEmergencyAckTimeout_requestsSmsFallbackSkeleton() = runTest {
        val auth = FakeAuthRepositoryForCaregiver()
        val care = FakeCareRepositoryForCaregiver()
        val viewModel = CaregiverViewModel(auth, care)

        viewModel.triggerEmergency(EmergencyType.FALL, "urgent")
        dispatcher.scheduler.advanceUntilIdle()
        dispatcher.scheduler.advanceTimeBy(60_000L)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(care.smsFallbackRequested)
    }
}

private class FakeAuthRepositoryForCaregiver : AuthRepository {
    private val _session = MutableStateFlow(
        UserSession(
            userId = "caregiver-1",
            phone = "01011112222",
            role = UserRole.CAREGIVER,
            circleId = "circle-1",
            circleInviteCode = "ABCD-1234"
        )
    )
    override val session: StateFlow<UserSession?> = _session.asStateFlow()

    override suspend fun requestOtp(phone: String): Result<Unit> = Result.success(Unit)
    override suspend fun verifyOtp(phone: String, otp: String): Result<UserSession> = Result.success(_session.value!!)
    override suspend fun selectRole(role: UserRole): Result<UserSession> = Result.success(_session.value!!)
    override suspend fun createCircle(name: String): Result<UserSession> = Result.success(_session.value!!)
    override suspend fun joinCircle(inviteCode: String): Result<UserSession> = Result.success(_session.value!!)
    override fun signOut() {
        _session.value = null
    }
}

private class FakeCareRepositoryForCaregiver(
    private val saveShouldFail: Boolean = false
) : CareRepository {
    private val logsFlow = MutableStateFlow<List<CareLog>>(emptyList())
    private val activeEmergencyFlow = MutableStateFlow<Emergency?>(null)
    override val activeEmergency: StateFlow<Emergency?> = activeEmergencyFlow.asStateFlow()
    override val connectionState: StateFlow<SupabaseConnectionState> =
        MutableStateFlow(SupabaseConnectionState.CONNECTED).asStateFlow()
    var smsFallbackRequested: Boolean = false

    override fun observeLogs(circleId: String): Flow<List<CareLog>> = logsFlow

    override fun observeTimeline(circleId: String): Flow<List<TimelineItem>> = MutableStateFlow(emptyList())

    override suspend fun saveLog(
        circleId: String,
        authorId: String,
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String
    ): Result<CareLog> {
        if (saveShouldFail) return Result.failure(IllegalStateException("save failed"))
        val log = CareLog(
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
            circleId = circleId,
            triggeredBy = authorId,
            type = type,
            note = note
        )
        activeEmergencyFlow.value = emergency
        return Result.success(emergency)
    }

    override suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit> = Result.success(Unit)

    override suspend fun syncPendingWrites(): Result<Unit> = Result.success(Unit)

    override fun schedulePendingSync() = Unit

    override suspend fun requestEmergencySmsFallback(emergencyId: String): Result<Unit> {
        smsFallbackRequested = true
        return Result.failure(IllegalStateException("ACK 지연: SMS 대체 알림 스켈레톤 트리거"))
    }
}
