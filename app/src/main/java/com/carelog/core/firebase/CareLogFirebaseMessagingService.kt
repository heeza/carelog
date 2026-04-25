package com.carelog.core.firebase

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.carelog.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class CareLogFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // TODO: Phase 1 backend 연결 시 토큰 업로드
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        createChannelIfNeeded()

        val title = message.notification?.title ?: "CareLog 알림"
        val body = message.notification?.body ?: (message.data["body"] ?: "새로운 업데이트가 있습니다")

        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createChannelIfNeeded() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            ALERT_CHANNEL_ID,
            "응급 알림",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "돌봄 응급 알림"
        }
        manager.createNotificationChannel(channel)
    }

    companion object {
        const val ALERT_CHANNEL_ID = "carelog_alert"
    }
}
