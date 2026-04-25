package com.carelog.feature.guardian

import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.model.CareLog
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.Emergency
import com.carelog.core.model.EmergencyStatus
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
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class GuardianViewModelTest {

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
    fun acknowledgeEmergencySuccess_clearsError() = runTest {
        val auth = FakeAuthRepositoryForGuardian()
        val care = FakeCareRepositoryForGuardian()
        val viewModel = GuardianViewModel(auth, care)

        viewModel.acknowledgeEmergency("em-1")
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(false, viewModel.uiState.value.isSubmitting)
        assertNull(viewModel.uiState.value.error)
    }

    @Test
    fun acknowledgeEmergencyFailure_setsError() = runTest {
        val auth = FakeAuthRepositoryForGuardian()
        val care = FakeCareRepositoryForGuardian(ackShouldFail = true)
        val viewModel = GuardianViewModel(auth, care)

        viewModel.acknowledgeEmergency("em-1")
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals("ack failed", viewModel.uiState.value.error)
    }
}

private class FakeAuthRepositoryForGuardian : AuthRepository {
    private val _session = MutableStateFlow(
        UserSession(
            userId = "guardian-1",
            phone = "01099998888",
            role = UserRole.GUARDIAN,
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

private class FakeCareRepositoryForGuardian(
    private val ackShouldFail: Boolean = false
) : CareRepository {
    private val logFlow = MutableStateFlow(
        listOf(
            CareLog(
                circleId = "circle-1",
                authorId = "caregiver-1",
                meal = MealStatus.COMPLETED,
                medication = MedicationStatus.COMPLETED,
                condition = ConditionStatus.GOOD,
                issue = IssueType.NONE
            )
        )
    )
    private val timelineFlow = MutableStateFlow<List<TimelineItem>>(emptyList())
    private val emergency = Emergency(
        id = "em-1",
        circleId = "circle-1",
        triggeredBy = "caregiver-1",
        type = EmergencyType.FALL,
        status = EmergencyStatus.ACTIVE
    )
    private val _activeEmergency = MutableStateFlow<Emergency?>(emergency)

    override val activeEmergency: StateFlow<Emergency?> = _activeEmergency.asStateFlow()
    override fun observeLogs(circleId: String): Flow<List<CareLog>> = logFlow
    override fun observeTimeline(circleId: String): Flow<List<TimelineItem>> = timelineFlow

    override suspend fun saveLog(
        circleId: String,
        authorId: String,
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String
    ): Result<CareLog> = Result.failure(UnsupportedOperationException())

    override suspend fun triggerEmergency(
        circleId: String,
        authorId: String,
        type: EmergencyType,
        note: String
    ): Result<Emergency> = Result.failure(UnsupportedOperationException())

    override suspend fun acknowledgeEmergency(emergencyId: String): Result<Unit> {
        if (ackShouldFail) return Result.failure(IllegalStateException("ack failed"))
        _activeEmergency.value = _activeEmergency.value?.copy(status = EmergencyStatus.ACKNOWLEDGED)
        return Result.success(Unit)
    }
}
