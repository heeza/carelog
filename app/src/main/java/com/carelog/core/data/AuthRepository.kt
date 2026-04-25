package com.carelog.core.data

import com.carelog.core.model.UserRole
import com.carelog.core.model.UserSession
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

interface AuthRepository {
    val session: StateFlow<UserSession?>
    suspend fun requestOtp(phone: String): Result<Unit>
    suspend fun verifyOtp(phone: String, otp: String): Result<UserSession>
    suspend fun selectRole(role: UserRole): Result<UserSession>
    suspend fun createCircle(name: String): Result<UserSession>
    suspend fun joinCircle(inviteCode: String): Result<UserSession>
    fun signOut()
}

@Singleton
class FakeAuthRepository @Inject constructor() : AuthRepository {
    private val _session = MutableStateFlow<UserSession?>(null)
    override val session: StateFlow<UserSession?> = _session.asStateFlow()

    override suspend fun requestOtp(phone: String): Result<Unit> {
        delay(300)
        return if (phone.length >= 10) Result.success(Unit) else Result.failure(IllegalArgumentException("전화번호를 확인하세요"))
    }

    override suspend fun verifyOtp(phone: String, otp: String): Result<UserSession> {
        delay(400)
        if (otp != "123456") {
            return Result.failure(IllegalArgumentException("인증번호가 올바르지 않습니다"))
        }
        val newSession = UserSession(userId = UUID.randomUUID().toString(), phone = phone)
        _session.value = newSession
        return Result.success(newSession)
    }

    override suspend fun selectRole(role: UserRole): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        val updated = current.copy(role = role)
        _session.value = updated
        return Result.success(updated)
    }

    override suspend fun createCircle(name: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        val circleId = UUID.randomUUID().toString()
        val inviteCode = name.take(2).uppercase() + "-" + circleId.takeLast(6).uppercase()
        val updated = current.copy(circleId = circleId, circleInviteCode = inviteCode)
        _session.value = updated
        return Result.success(updated)
    }

    override suspend fun joinCircle(inviteCode: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        if (inviteCode.length < 6) return Result.failure(IllegalArgumentException("초대 코드를 확인하세요"))
        val updated = current.copy(circleId = "circle-${inviteCode.lowercase()}", circleInviteCode = inviteCode.uppercase())
        _session.value = updated
        return Result.success(updated)
    }

    override fun signOut() {
        _session.value = null
    }
}
