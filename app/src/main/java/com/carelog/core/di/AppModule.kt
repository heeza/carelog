package com.carelog.core.di

import android.content.Context
import androidx.room.Room
import androidx.work.WorkManager
import com.carelog.BuildConfig
import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.data.DataStoreUiSettingsRepository
import com.carelog.core.data.SupabaseAuthRepository
import com.carelog.core.data.SupabaseCareRepository
import com.carelog.core.data.UiSettingsRepository
import com.carelog.core.local.CareLocalDao
import com.carelog.core.local.CareLocalDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAuthRepository(repository: SupabaseAuthRepository): AuthRepository = repository

    @Provides
    @Singleton
    fun provideCareRepository(repository: SupabaseCareRepository): CareRepository = repository

    @Provides
    @Singleton
    fun provideUiSettingsRepository(repository: DataStoreUiSettingsRepository): UiSettingsRepository = repository

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient? {
        if (BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank()) {
            return null
        }
        return createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(GoTrue)
            install(Postgrest)
            install(Realtime)
        }
    }

    @Provides
    @Singleton
    fun provideCareLocalDatabase(@ApplicationContext context: Context): CareLocalDatabase {
        return Room.databaseBuilder(
            context,
            CareLocalDatabase::class.java,
            "carelog-local.db"
        ).build()
    }

    @Provides
    fun provideCareLocalDao(database: CareLocalDatabase): CareLocalDao = database.careLocalDao()

    @Provides
    @Singleton
    fun provideWorkManager(@ApplicationContext context: Context): WorkManager = WorkManager.getInstance(context)
}
