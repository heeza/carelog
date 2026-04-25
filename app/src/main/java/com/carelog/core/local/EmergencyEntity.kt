package com.carelog.core.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "emergencies",
    indices = [Index(value = ["circleId"]), Index(value = ["syncState"])]
)
data class EmergencyEntity(
    @PrimaryKey val id: String,
    val circleId: String,
    val triggeredBy: String,
    val triggeredAtEpochMillis: Long,
    val type: String,
    val note: String,
    val status: String,
    val acknowledgedAtEpochMillis: Long? = null,
    val syncState: String,
    val lastError: String? = null,
)
