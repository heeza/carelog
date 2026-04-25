package com.carelog.feature.auth

import com.carelog.core.data.AuthRepository
import com.carelog.core.model.UserRole
import com.carelog.core.model.UserSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

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
    fun requestOtpSuccess_updatesOtpRequested() = runTest {
        val repo = FakeAuthRepositoryForTest()
        val viewModel = AuthViewModel(repo)

        viewModel.updatePhone("01012341234")
        viewModel.requestOtp()
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.otpRequested)
        assertEquals(null, viewModel.uiState.value.error)
    }

    @Test
    fun verifyOtpFailure_setsError() = runTest {
        val repo = FakeAuthRepositoryForTest(verifyShouldFail = true)
        val viewModel = AuthViewModel(repo)

        viewModel.updatePhone("01012341234")
        viewModel.updateOtp("000000")
        viewModel.verifyOtp()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals("invalid", viewModel.uiState.value.error)
    }

    @Test
    fun selectRoleSuccess_updatesSessionRole() = runTest {
        val repo = FakeAuthRepositoryForTest()
        val viewModel = AuthViewModel(repo)

        viewModel.updatePhone("01012341234")
        viewModel.updateOtp("123456")
        viewModel.verifyOtp()
        dispatcher.scheduler.advanceUntilIdle()

        viewModel.selectRole(UserRole.CAREGIVER)
        dispatcher.scheduler.advanceUntilIdle()

        assertNotNull(viewModel.uiState.value.session)
        assertEquals(UserRole.CAREGIVER, viewModel.uiState.value.session?.role)
    }
}

private class FakeAuthRepositoryForTest(
    private val verifyShouldFail: Boolean = false
) : AuthRepository {
    private val _session = MutableStateFlow<UserSession?>(null)
    override val session: StateFlow<UserSession?> = _session

    override suspend fun requestOtp(phone: String): Result<Unit> = Result.success(Unit)

    override suspend fun verifyOtp(phone: String, otp: String): Result<UserSession> {
        if (verifyShouldFail) return Result.failure(IllegalArgumentException("invalid"))
        val session = UserSession(userId = "user-1", phone = phone)
        _session.value = session
        return Result.success(session)
    }

    override suspend fun selectRole(role: UserRole): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("missing"))
        val updated = current.copy(role = role)
        _session.value = updated
        return Result.success(updated)
    }

    override suspend fun createCircle(name: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("missing"))
        val updated = current.copy(circleId = "circle-1", circleInviteCode = "ABCD-1234")
        _session.value = updated
        return Result.success(updated)
    }

    override suspend fun joinCircle(inviteCode: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("missing"))
        val updated = current.copy(circleId = "circle-1", circleInviteCode = inviteCode)
        _session.value = updated
        return Result.success(updated)
    }

    override fun signOut() {
        _session.value = null
    }
}
