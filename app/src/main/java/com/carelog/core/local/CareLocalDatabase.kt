package com.carelog.core.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [LogEntity::class, EmergencyEntity::class],
    version = 1,
    exportSchema = false
)
abstract class CareLocalDatabase : RoomDatabase() {
    abstract fun careLocalDao(): CareLocalDao
}
