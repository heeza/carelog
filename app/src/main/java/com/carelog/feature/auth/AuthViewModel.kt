package com.carelog.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.carelog.core.data.AuthRepository
import com.carelog.core.model.UserRole
import com.carelog.core.model.UserSession
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val phone: String = "",
    val otp: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val otpRequested: Boolean = false,
    val session: UserSession? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val session = authRepository.session

    fun updatePhone(phone: String) {
        _uiState.update { it.copy(phone = phone, error = null) }
    }

    fun updateOtp(otp: String) {
        _uiState.update { it.copy(otp = otp, error = null) }
    }

    fun requestOtp() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.requestOtp(_uiState.value.phone)
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, otpRequested = true) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun verifyOtp() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val phone = _uiState.value.phone
            val otp = _uiState.value.otp
            authRepository.verifyOtp(phone, otp)
                .onSuccess { session ->
                    _uiState.update { it.copy(isLoading = false, session = session) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun selectRole(role: UserRole) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.selectRole(role)
                .onSuccess { session -> _uiState.update { it.copy(isLoading = false, session = session) } }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun createCircle(name: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.createCircle(name)
                .onSuccess { session -> _uiState.update { it.copy(isLoading = false, session = session) } }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun joinCircle(inviteCode: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.joinCircle(inviteCode)
                .onSuccess { session -> _uiState.update { it.copy(isLoading = false, session = session) } }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }
}
