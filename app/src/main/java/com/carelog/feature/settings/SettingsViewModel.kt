package com.carelog.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.carelog.core.data.UiSettings
import com.carelog.core.data.UiSettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: UiSettingsRepository,
) : ViewModel() {

    val settings: StateFlow<UiSettings> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UiSettings())

    fun setLargeText(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setLargeText(enabled) }
    }

    fun setHighContrast(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setHighContrast(enabled) }
    }
}
