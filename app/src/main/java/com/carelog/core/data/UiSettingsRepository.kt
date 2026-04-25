package com.carelog.core.data

import android.content.Context
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.preferencesDataStoreFile
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

data class UiSettings(
    val largeText: Boolean = false,
    val highContrast: Boolean = false,
)

interface UiSettingsRepository {
    val settings: Flow<UiSettings>
    suspend fun setLargeText(enabled: Boolean)
    suspend fun setHighContrast(enabled: Boolean)
}

@Singleton
class DataStoreUiSettingsRepository @Inject constructor(
    @ApplicationContext context: Context,
) : UiSettingsRepository {

    private val dataStore = PreferenceDataStoreFactory.create {
        context.preferencesDataStoreFile(DATASTORE_NAME)
    }

    override val settings: Flow<UiSettings> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            UiSettings(
                largeText = preferences[LARGE_TEXT_KEY] ?: false,
                highContrast = preferences[HIGH_CONTRAST_KEY] ?: false,
            )
        }

    override suspend fun setLargeText(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[LARGE_TEXT_KEY] = enabled
        }
    }

    override suspend fun setHighContrast(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[HIGH_CONTRAST_KEY] = enabled
        }
    }

    private companion object {
        const val DATASTORE_NAME = "ui_settings.preferences_pb"
        val LARGE_TEXT_KEY = booleanPreferencesKey("large_text_enabled")
        val HIGH_CONTRAST_KEY = booleanPreferencesKey("high_contrast_enabled")
    }
}
