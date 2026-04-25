package com.carelog.core.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CareLocalDaoTest {

    private lateinit var database: CareLocalDatabase
    private lateinit var dao: CareLocalDao

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, CareLocalDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.careLocalDao()
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun insertAndQueryLogs_returnsNewestFirst() = runTest {
        dao.upsertLog(
            LogEntity(
                id = log-1,
                circleId = circle-1,
                authorId = user-1,
                occurredAtEpochMillis = 1000L,
                meal = completed,
                medication = completed,
                condition = good,
                issue = none,
                note = a,
                syncState = SyncState.PENDING.name,
            )
        )
        dao.upsertLog(
            LogEntity(
                id = log-2,
                circleId = circle-1,
                authorId = user-1,
                occurredAtEpochMillis = 2000L,
                meal = completed,
                medication = completed,
                condition = good,
                issue = none,
                note = b,
                syncState = SyncState.PENDING.name,
            )
        )

        val logs = dao.observeLogs(circle-1).first()

        assertEquals(2, logs.size)
        assertEquals(log-2, logs.first().id)
    }

    @Test
    fun pendingQueryAndAcknowledge_updatesSyncState() = runTest {
        dao.upsertEmergency(
            EmergencyEntity(
                id = em-1,
                circleId = circle-1,
                triggeredBy = user-1,
                triggeredAtEpochMillis = 1000L,
                type = fall,
                note = ,
                status = active,
                syncState = SyncState.PENDING.name,
            )
        )

        val pendingBefore = dao.getPendingEmergencies()
        assertEquals(1, pendingBefore.size)

        dao.acknowledgeEmergency(
            id = em-1,
            status = acknowledged,
            acknowledgedAtEpochMillis = 5000L,
            syncState = SyncState.PENDING.name,
        )

        val emergencies = dao.observeEmergencies(circle-1).first()
        assertEquals(acknowledged, emergencies.first().status)

        dao.updateEmergencySyncState(em-1, SyncState.SYNCED.name, null)
        val pendingAfter = dao.getPendingEmergencies()
        assertTrue(pendingAfter.isEmpty())
    }
}
