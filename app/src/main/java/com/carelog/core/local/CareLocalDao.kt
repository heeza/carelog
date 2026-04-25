package com.carelog.core.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CareLocalDao {
    @Query("SELECT * FROM logs WHERE circleId = :circleId ORDER BY occurredAtEpochMillis DESC")
    fun observeLogs(circleId: String): Flow<List<LogEntity>>

    @Query("SELECT * FROM emergencies WHERE circleId = :circleId ORDER BY triggeredAtEpochMillis DESC")
    fun observeEmergencies(circleId: String): Flow<List<EmergencyEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLog(log: LogEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLogs(logs: List<LogEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertEmergency(emergency: EmergencyEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertEmergencies(emergencies: List<EmergencyEntity>)

    @Query("SELECT * FROM logs WHERE syncState != :syncedState ORDER BY occurredAtEpochMillis ASC")
    suspend fun getPendingLogs(syncedState: String = "SYNCED"): List<LogEntity>

    @Query("SELECT * FROM emergencies WHERE syncState != :syncedState ORDER BY triggeredAtEpochMillis ASC")
    suspend fun getPendingEmergencies(syncedState: String = "SYNCED"): List<EmergencyEntity>

    @Query("UPDATE logs SET syncState = :syncState, lastError = :lastError WHERE id = :id")
    suspend fun updateLogSyncState(id: String, syncState: String, lastError: String?)

    @Query("UPDATE emergencies SET syncState = :syncState, lastError = :lastError WHERE id = :id")
    suspend fun updateEmergencySyncState(id: String, syncState: String, lastError: String?)

    @Query(
        "UPDATE emergencies SET status = :status, acknowledgedAtEpochMillis = :acknowledgedAtEpochMillis, syncState = :syncState WHERE id = :id"
    )
    suspend fun acknowledgeEmergency(
        id: String,
        status: String,
        acknowledgedAtEpochMillis: Long,
        syncState: String,
    )
}
