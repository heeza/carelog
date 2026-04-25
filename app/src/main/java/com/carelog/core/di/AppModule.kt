package com.carelog.core.di

import com.carelog.BuildConfig
import com.carelog.core.data.AuthRepository
import com.carelog.core.data.CareRepository
import com.carelog.core.data.SupabaseAuthRepository
import com.carelog.core.data.SupabaseCareRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
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
}
