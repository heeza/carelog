package com.carelog.core.data

import com.carelog.core.model.UserRole
import com.carelog.core.model.UserSession
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.providers.builtin.OtpType
import io.github.jan.supabase.postgrest.from
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

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
class SupabaseAuthRepository @Inject constructor(
    private val supabaseClient: SupabaseClient?
) : AuthRepository {
    private val _session = MutableStateFlow<UserSession?>(null)
    override val session: StateFlow<UserSession?> = _session.asStateFlow()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        scope.launch {
            val client = supabaseClient ?: return@launch
            restoreSession(client)
        }
    }

    override suspend fun requestOtp(phone: String): Result<Unit> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        if (phone.length < 10) return Result.failure(IllegalArgumentException("전화번호를 확인하세요"))
        return runCatching {
            client.auth.signInWith(OTP) { this.phone = phone }
        }
    }

    override suspend fun verifyOtp(phone: String, otp: String): Result<UserSession> {
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        return runCatching {
            client.auth.verifyPhoneOtp(
                type = OtpType.Phone.SMS,
                phone = phone,
                token = otp
            )
            ensureProfile(client, phone)
            restoreSession(client)
            _session.value ?: throw IllegalStateException("인증 세션을 불러오지 못했습니다")
        }
    }

    override suspend fun selectRole(role: UserRole): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        val updated = current.copy(role = role)
        _session.value = updated
        return Result.success(updated)
    }

    override suspend fun createCircle(name: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        return runCatching {
            val circle = client.from("care_circles").insert(
                buildJsonObject {
                    put("name", name)
                    put("created_by", current.userId)
                }
            ) { select() }.decodeSingle<JsonObject>()

            val circleId = circle.requiredString("id") ?: throw IllegalStateException("원 생성 실패")
            val role = current.role ?: UserRole.CAREGIVER
            client.from("circle_members").insert(
                buildJsonObject {
                    put("circle_id", circleId)
                    put("profile_id", current.userId)
                    put("role", role.toDbValue())
                }
            )

            val inviteCode = circle.requiredString("invite_code") ?: ""
            val updated = current.copy(circleId = circleId, circleInviteCode = inviteCode)
            _session.value = updated
            updated
        }
    }

    override suspend fun joinCircle(inviteCode: String): Result<UserSession> {
        val current = _session.value ?: return Result.failure(IllegalStateException("세션이 없습니다"))
        val client = supabaseClient ?: return Result.failure(IllegalStateException("Supabase 설정이 필요합니다"))
        if (inviteCode.length < 6) return Result.failure(IllegalArgumentException("초대 코드를 확인하세요"))
        val normalizedCode = inviteCode.trim().uppercase()
        return runCatching {
            val circle = client.from("care_circles").select {
                filter { eq("invite_code", normalizedCode) }
            }.decodeList<JsonObject>().firstOrNull() ?: throw IllegalArgumentException("유효하지 않은 초대 코드입니다")

            val circleId = circle.requiredString("id") ?: throw IllegalStateException("원 조회 실패")
            val role = current.role ?: UserRole.GUARDIAN
            client.from("circle_members").upsert(
                buildJsonObject {
                    put("circle_id", circleId)
                    put("profile_id", current.userId)
                    put("role", role.toDbValue())
                }
            ) {
                onConflict = "circle_id,profile_id"
            }

            val updated = current.copy(circleId = circleId, circleInviteCode = normalizedCode)
            _session.value = updated
            updated
        }
    }

    override fun signOut() {
        _session.value = null
        val client = supabaseClient ?: return
        scope.launch {
            runCatching { client.auth.signOut() }
        }
    }

    private suspend fun restoreSession(client: SupabaseClient) {
        val authSession = client.auth.currentSessionOrNull() ?: return
        val userId = authSession.user?.id ?: return
        val phone = authSession.user?.phone.orEmpty()
        val member = client.from("circle_members").select {
            filter { eq("profile_id", userId) }
        }.decodeList<JsonObject>().firstOrNull()
        val circleId = member?.requiredString("circle_id")
        val role = member?.requiredString("role")?.toUserRole()
        val inviteCode = if (circleId == null) {
            null
        } else {
            client.from("care_circles").select {
                filter { eq("id", circleId) }
            }.decodeList<JsonObject>().firstOrNull()?.requiredString("invite_code")
        }
        _session.value = UserSession(
            userId = userId,
            phone = phone,
            role = role,
            circleId = circleId,
            circleInviteCode = inviteCode
        )
    }

    private suspend fun ensureProfile(client: SupabaseClient, phone: String) {
        val userId = client.auth.currentSessionOrNull()?.user?.id ?: return
        client.from("profiles").upsert(
            buildJsonObject {
                put("id", userId)
                put("phone", phone)
            }
        ) {
            onConflict = "id"
        }
    }

    private fun JsonObject.requiredString(key: String): String? = this[key]?.jsonPrimitive?.content

    private fun UserRole.toDbValue(): String = when (this) {
        UserRole.CAREGIVER -> "caregiver"
        UserRole.GUARDIAN -> "guardian"
    }

    private fun String.toUserRole(): UserRole? = when (lowercase()) {
        "caregiver" -> UserRole.CAREGIVER
        "guardian" -> UserRole.GUARDIAN
        else -> null
    }
}
