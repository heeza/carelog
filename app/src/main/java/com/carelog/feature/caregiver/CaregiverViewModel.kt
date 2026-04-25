package com.carelog.feature.caregiver

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.model.CareLog
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.EmergencyType
import com.carelog.core.model.IssueType
import com.carelog.core.model.MealStatus
import com.carelog.core.model.MedicationStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class CaregiverUiState(
    val isSaving: Boolean = false,
    val message: String? = null,
    val emergencySent: Boolean = false,
)

@HiltViewModel
class CaregiverViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val careRepository: CareRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(CaregiverUiState())
    val uiState: StateFlow<CaregiverUiState> = _uiState.asStateFlow()

    private val circleId: String
        get() = authRepository.session.value?.circleId ?: "demo-circle"

    private val userId: String
        get() = authRepository.session.value?.userId ?: "demo-caregiver"

    val logs: StateFlow<List<CareLog>> = careRepository.observeLogs(circleId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun saveLog(
        meal: MealStatus,
        medication: MedicationStatus,
        condition: ConditionStatus,
        issue: IssueType,
        note: String,
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, message = null)
            careRepository.saveLog(
                circleId = circleId,
                authorId = userId,
                meal = meal,
                medication = medication,
                condition = condition,
                issue = issue,
                note = note,
            ).onSuccess {
                _uiState.value = _uiState.value.copy(isSaving = false, message = "저장 완료")
            }.onFailure {
                _uiState.value = _uiState.value.copy(isSaving = false, message = it.message ?: "저장 실패")
            }
        }
    }

    fun triggerEmergency(type: EmergencyType, note: String) {
        viewModelScope.launch {
            careRepository.triggerEmergency(circleId, userId, type, note)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(emergencySent = true, message = "응급 전송")
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(message = it.message ?: "응급 실패")
                }
        }
    }
}
