package com.carelog.feature.guardian

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.model.Emergency
import com.carelog.core.model.TimelineItem
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class GuardianUiState(
    val isSubmitting: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class GuardianViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val careRepository: CareRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(GuardianUiState())
    val uiState: StateFlow<GuardianUiState> = _uiState.asStateFlow()

    private val circleId: String
        get() = authRepository.session.value?.circleId ?: "demo-circle"

    val timeline: StateFlow<List<TimelineItem>> = careRepository.observeTimeline(circleId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val activeEmergency: StateFlow<Emergency?> = careRepository.activeEmergency
        .map { emergency -> emergency?.takeIf { it.circleId == circleId } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    fun acknowledgeEmergency(emergencyId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            careRepository.acknowledgeEmergency(emergencyId)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = null)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "확인 실패")
                }
        }
    }
}
