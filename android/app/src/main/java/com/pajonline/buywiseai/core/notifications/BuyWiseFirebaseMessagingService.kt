package com.pajonline.buywiseai.core.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class BuyWiseFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(TAG, "New FCM Token received: ${token.take(15)}...")
        BuyWiseNotificationManager.syncDeviceToken(applicationContext)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.i(TAG, "FCM Message received from: ${remoteMessage.from}")

        val data = remoteMessage.data
        val notification = remoteMessage.notification

        val title = notification?.title
            ?: data["title"]
            ?: "BuyWise AI Alert"

        val message = notification?.body
            ?: data["message"]
            ?: data["body"]
            ?: "You have a new update from BuyWise AI."

        val type = data["type"] ?: "GENERAL"
        val submissionId = data["submissionId"]
        val status = data["status"]

        // Real-time reactive update on linked device
        if (!submissionId.isNullOrBlank() && !status.isNullOrBlank()) {
            try {
                com.pajonline.buywiseai.data.repository.CompetitionRepository.moderateSubmission(submissionId, status)
            } catch (_: Exception) {}
        }

        val targetRoute = data["targetRoute"]
            ?: if (type.contains("VOTE") || type.contains("ENTRY")) "competition" else "alerts"

        BuyWiseNotificationManager.showNotification(
            context = applicationContext,
            title = title,
            message = message,
            type = type,
            targetRoute = targetRoute,
            notificationId = (System.currentTimeMillis() % 100000).toInt()
        )
    }

    companion object {
        private const val TAG = "BuyWiseFcmService"
    }
}
