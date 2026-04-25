package com.carelog.core.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "logs",
    indices = [Index(value = ["circleId"]), Index(value = ["syncState"])]
)
data class LogEntity(
    @PrimaryKey val id: String,
    val circleId: String,
    val authorId: String,
    val occurredAtEpochMillis: Long,
    val meal: String,
    val medication: String,
    val condition: String,
    val issue: String,
    val note: String,
    val syncState: String,
    val lastError: String? = null,
)
