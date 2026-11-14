package com.pajonline.buywiseai.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.pajonline.buywiseai.MainActivity
import com.pajonline.buywiseai.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

object BuyWiseNotificationManager {

    private const val TAG = "BuyWiseNotifMgr"

    const val CHANNEL_COMPETITION = "buywise_competition_channel"
    const val CHANNEL_ALERTS = "buywise_alerts_channel"

    private var realtimeListener: ListenerRegistration? = null
    private var deviceSyncListener: ListenerRegistration? = null
    private val processedNotificationIds = mutableSetOf<String>()

    private const val PREFS_NOTIF = "buywise_processed_notifications"
    private const val KEY_PROCESSED_SET = "processed_notif_ids"

    fun isNotificationAlreadyProcessed(context: Context, id: String): Boolean {
        if (processedNotificationIds.contains(id)) return true
        val prefs = context.getSharedPreferences(PREFS_NOTIF, Context.MODE_PRIVATE)
        val saved = prefs.getStringSet(KEY_PROCESSED_SET, emptySet()) ?: emptySet()
        if (saved.contains(id)) {
            processedNotificationIds.add(id)
            return true
        }
        return false
    }

    fun recordProcessedNotificationId(context: Context, id: String) {
        processedNotificationIds.add(id)
        try {
            val prefs = context.getSharedPreferences(PREFS_NOTIF, Context.MODE_PRIVATE)
            val saved = prefs.getStringSet(KEY_PROCESSED_SET, emptySet())?.toMutableSet() ?: mutableSetOf()
            if (saved.size > 200) {
                val toRemove = saved.take(50)
                saved.removeAll(toRemove.toSet())
            }
            saved.add(id)
            prefs.edit().putStringSet(KEY_PROCESSED_SET, saved).apply()
        } catch (_: Exception) {}
    }

    fun init(context: Context) {
        createNotificationChannels(context)
        syncDeviceToken(context)
        startRealtimeNotificationListener(context)
        startLinkedDeviceListener(context)
        syncLinkedDeviceState(context)
    }

    /**
     * Stably retrieves or initializes a persistent device/voter ID
     */
    fun getOrCreateDeviceUid(context: Context): String {
        val auth = FirebaseAuth.getInstance()
        val authUid = auth.currentUser?.uid
        if (!authUid.isNullOrBlank()) return authUid

        val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
        var voterId = prefs.getString("saved_device_voter_id", null)
        if (voterId.isNullOrBlank()) {
            val compPrefs = context.getSharedPreferences("buywise_competition_prefs", Context.MODE_PRIVATE)
            voterId = compPrefs.getString("user_voter_uuid", null)
            if (voterId.isNullOrBlank()) {
                voterId = "voter_${UUID.randomUUID().toString().take(8)}"
                compPrefs.edit().putString("user_voter_uuid", voterId).apply()
            }
            prefs.edit().putString("saved_device_voter_id", voterId).apply()
        }
        return voterId
    }

    /**
     * Retrieves the linked mobile phone number with standard fallback
     */
    fun getLinkedMobile(context: Context): String {
        val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
        return prefs.getString("saved_user_phone", "")?.takeIf { it.isNotBlank() } ?: "+91 98765 43210"
    }

    /**
     * Create high-priority notification channels for Android 8.0+ (Oreo+)
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return

            // 1. Weekly Competition & Vote Updates Channel (HIGH Importance, Sound, Vibration)
            val competitionChannel = NotificationChannel(
                CHANNEL_COMPETITION,
                "BuyWise Fashion Challenge & Votes",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Instant notifications when your look receives votes, gets approved, or wins the challenge."
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
                enableLights(true)
                setShowBadge(true)
            }

            // 2. Price Drop & Stock Alerts Channel
            val alertsChannel = NotificationChannel(
                CHANNEL_ALERTS,
                "Price Drop & Deal Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Real-time alerts when tracked products hit your target price across 14 stores."
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            }

            notificationManager.createNotificationChannel(competitionChannel)
            notificationManager.createNotificationChannel(alertsChannel)
            Log.i(TAG, "Notification channels initialized successfully.")
        }
    }

    /**
     * Fetches FCM Token and syncs to Firestore under `notification_tokens` and current user doc
     */
    fun syncDeviceToken(context: Context) {
        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                    return@addOnCompleteListener
                }

                val token = task.result ?: return@addOnCompleteListener
                Log.i(TAG, "FCM Device Token retrieved: ${token.take(15)}...")

                val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
                prefs.edit().putString("fcm_device_token", token).apply()

                val currentUid = getOrCreateDeviceUid(context)
                val linkedMobile = getLinkedMobile(context)
                val cleanPhone = linkedMobile.filter { it.isDigit() }
                val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

                val db = FirebaseFirestore.getInstance()
                val tokenData = hashMapOf(
                    "userId" to currentUid,
                    "tokenOrEndpoint" to token,
                    "platform" to "android",
                    "provider" to "fcm",
                    "linkedMobile" to linkedMobile,
                    "active" to true,
                    "updatedAt" to now
                )

                // Save to notification_tokens collection for userId
                db.collection("notification_tokens").document("tok_${currentUid}_android").set(tokenData)
                    .addOnSuccessListener {
                        Log.i(TAG, "FCM token synced to Firestore for user $currentUid (Mobile: $linkedMobile)")
                    }
                    .addOnFailureListener { e ->
                        Log.w(TAG, "FCM token Firestore sync note: ${e.message}")
                    }

                // Also map by clean mobile number so targeted mobile notifications find this device
                if (cleanPhone.isNotBlank()) {
                    db.collection("notification_tokens").document("tok_mobile_$cleanPhone").set(tokenData, SetOptions.merge())
                }

                // If logged in with Firebase Auth, update users doc
                val auth = FirebaseAuth.getInstance()
                if (auth.currentUser != null) {
                    db.collection("users").document(auth.currentUser!!.uid).update(
                        mapOf(
                            "fcmToken" to token,
                            "mobile" to linkedMobile,
                            "lastTokenUpdate" to now
                        )
                    ).addOnFailureListener { /* silently ignore if doc not yet created */ }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "FCM Token sync error note: ${e.message}")
        }
    }

    /**
     * Listen in real-time to Firestore `user_notifications` for instant alerts on this device
     */
    fun startRealtimeNotificationListener(context: Context) {
        try {
            realtimeListener?.remove()

            val currentUid = getOrCreateDeviceUid(context)
            val linkedMobile = getLinkedMobile(context)
            val cleanPhone = linkedMobile.filter { it.isDigit() }
            val listenerStartTime = System.currentTimeMillis()

            val db = FirebaseFirestore.getInstance()
            var isFirstSnapshot = true

            // Listen to recent 30 notifications in user_notifications
            realtimeListener = db.collection("user_notifications")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .limit(30)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.w(TAG, "Notifications listener note: ${error.message}")
                        return@addSnapshotListener
                    }

                    if (snapshot != null) {
                        // On cold start, record all existing IDs as processed so historical items NEVER trigger popups
                        if (isFirstSnapshot) {
                            for (doc in snapshot.documents) {
                                recordProcessedNotificationId(context, doc.id)
                            }
                            isFirstSnapshot = false
                            return@addSnapshotListener
                        }

                        for (change in snapshot.documentChanges) {
                            if (change.type == com.google.firebase.firestore.DocumentChange.Type.ADDED ||
                                change.type == com.google.firebase.firestore.DocumentChange.Type.MODIFIED
                            ) {
                                val doc = change.document
                                val id = doc.id
                                if (isNotificationAlreadyProcessed(context, id)) continue

                                val title = doc.getString("title") ?: "BuyWise AI Notification"
                                val message = doc.getString("message") ?: ""
                                val notifType = doc.getString("type") ?: "GENERAL"
                                val submissionId = doc.getString("submissionId")
                                val docUserId = doc.getString("userId") ?: ""
                                val docMobile = doc.getString("linkedMobile") ?: ""
                                val docCleanMobile = docMobile.filter { it.isDigit() }
                                val deliveredToMobile = doc.getBoolean("deliveredToMobile") ?: false
                                val createdAtStr = doc.getString("createdAt")

                                // 1. Always apply state updates to local repository quietly
                                if (!submissionId.isNullOrBlank()) {
                                    try {
                                        val status = doc.getString("status")
                                        if (status != null) {
                                            com.pajonline.buywiseai.data.repository.CompetitionRepository.moderateSubmission(submissionId, status)
                                        }
                                        val voteCount = doc.getLong("voteCount")
                                        if (voteCount != null) {
                                            com.pajonline.buywiseai.data.repository.CompetitionRepository.updateSubmissionVoteCount(submissionId, voteCount.toInt())
                                        }
                                    } catch (_: Exception) {}
                                }

                                // 2. Check if this is a historical item created before this app session started
                                val isHistorical = if (!createdAtStr.isNullOrBlank()) {
                                    try {
                                        val cleanDate = createdAtStr.substringBefore("Z")
                                        val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(cleanDate)
                                        val timeMs = parsed?.time ?: 0L
                                        timeMs < (listenerStartTime - 10000)
                                    } catch (_: Exception) {
                                        false
                                    }
                                } else {
                                    false
                                }

                                if (isHistorical) {
                                    recordProcessedNotificationId(context, id)
                                    continue
                                }

                                // Rule: Do not send reminder of voting if already sent, or if user already voted
                                if (notifType == "VOTING_REMINDER") {
                                    val compId = doc.getString("competitionId") ?: "default_comp"
                                    val prefs = context.getSharedPreferences("buywise_competition_prefs", Context.MODE_PRIVATE)
                                    val alreadyVoted = prefs.getString("voted_sub_$compId", null) != null ||
                                            com.pajonline.buywiseai.data.repository.CompetitionRepository.hasVoted(compId, currentUid)
                                    val reminderAlreadySent = prefs.getBoolean("voting_reminder_sent_$compId", false)
                                    if (alreadyVoted || reminderAlreadySent) {
                                        Log.i(TAG, "Voting reminder already sent or user already voted for $compId. Suppressing.")
                                        recordProcessedNotificationId(context, id)
                                        continue
                                    }
                                    prefs.edit().putBoolean("voting_reminder_sent_$compId", true).apply()
                                }

                                // Targeted delivery check
                                val matchesUser = docUserId.isNotBlank() && (docUserId == currentUid || docUserId == "all" || docUserId == "guest_user")
                                val matchesPhone = linkedMobile.isNotBlank() && (docMobile == linkedMobile || (cleanPhone.isNotBlank() && docCleanMobile == cleanPhone))

                                if (matchesUser || matchesPhone || deliveredToMobile) {
                                    recordProcessedNotificationId(context, id)

                                    // Trigger instant heads-up status bar notification on mobile ONLY for genuine new real-time events
                                    showNotification(
                                        context = context,
                                        title = title,
                                        message = message,
                                        type = notifType,
                                        targetRoute = if (notifType.contains("VOTE") || notifType.contains("ENTRY")) "competition" else "alerts",
                                        notificationId = id.hashCode()
                                    )
                                }
                            }
                        }
                    }
                }
        } catch (e: Exception) {
            Log.w(TAG, "Realtime notification listener note: ${e.message}")
        }
    }

    /**
     * Snapshot listener on `user_devices` to react ONLY to explicit Admin FORCE_UPDATE clicks
     * (Never replay stale vote notifications upon app open)
     */
    fun startLinkedDeviceListener(context: Context) {
        try {
            deviceSyncListener?.remove()

            val currentUid = getOrCreateDeviceUid(context)
            val linkedMobile = getLinkedMobile(context)
            val cleanPhone = linkedMobile.filter { it.isDigit() }
            val db = FirebaseFirestore.getInstance()

            val targetDoc = if (cleanPhone.isNotBlank()) "mobile_$cleanPhone" else "device_$currentUid"
            var isFirstCheck = true

            deviceSyncListener = db.collection("user_devices").document(targetDoc)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null || !snapshot.exists()) return@addSnapshotListener
                    if (isFirstCheck) {
                        isFirstCheck = false
                        return@addSnapshotListener
                    }

                    // Only react to explicit remote FORCE_UPDATE commands from Admin console
                    val command = snapshot.getString("command") ?: ""
                    if (command != "FORCE_UPDATE") {
                        return@addSnapshotListener
                    }

                    val syncVersion = snapshot.getLong("syncVersion") ?: 0L
                    val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
                    val lastProcessedVersion = prefs.getLong("last_processed_sync_version", 0L)
                    if (syncVersion != 0L && syncVersion <= lastProcessedVersion) {
                        return@addSnapshotListener
                    }
                    if (syncVersion != 0L) {
                        prefs.edit().putLong("last_processed_sync_version", syncVersion).apply()
                    }

                    Log.i(TAG, "Explicit Admin FORCE_UPDATE command detected: $command (version: $syncVersion)")

                    showNotification(
                        context = context,
                        title = "⚡ Linked Mobile Updated",
                        message = "Your mobile device state is synchronized with the latest fashion votes & challenge entries!",
                        type = "DEVICE_STATE_SYNC",
                        targetRoute = "competition"
                    )
                }
        } catch (e: Exception) {
            Log.w(TAG, "Linked device listener note: ${e.message}")
        }
    }

    /**
     * Synchronize linked device state with Firestore `user_devices`
     */
    fun syncLinkedDeviceState(context: Context, onComplete: ((Boolean) -> Unit)? = null) {
        try {
            val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
            val currentUid = getOrCreateDeviceUid(context)
            val linkedMobile = getLinkedMobile(context)
            val cleanPhone = linkedMobile.filter { it.isDigit() }
            val fcmToken = prefs.getString("fcm_device_token", "") ?: ""

            val manufacturer = Build.MANUFACTURER.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.US) else it.toString() }
            val deviceName = "$manufacturer ${Build.MODEL}"
            val androidVer = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
            val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

            val deviceData = hashMapOf(
                "deviceId" to currentUid,
                "userId" to currentUid,
                "deviceName" to deviceName,
                "osVersion" to androidVer,
                "platform" to "android",
                "linkedMobile" to linkedMobile,
                "fcmToken" to fcmToken,
                "status" to "ONLINE",
                "lastSyncedAt" to now,
                "appVersion" to "1.0.0"
            )

            val db = FirebaseFirestore.getInstance()
            // 1. Sync device document by userId/deviceId
            db.collection("user_devices").document("device_$currentUid").set(deviceData, SetOptions.merge())
                .addOnSuccessListener {
                    Log.i(TAG, "Linked device $deviceName synced to Firestore successfully.")
                    prefs.edit().putString("last_device_sync_time", now).apply()
                    onComplete?.invoke(true)
                }
                .addOnFailureListener { e ->
                    Log.w(TAG, "Device sync note: ${e.message}")
                    onComplete?.invoke(false)
                }

            // 2. Also map to mobile_${cleanPhone} so updates by phone number reach this mobile
            if (cleanPhone.isNotBlank()) {
                db.collection("user_devices").document("mobile_$cleanPhone").set(deviceData, SetOptions.merge())
            }

            // 3. Fallback generic device document
            db.collection("user_devices").document("device_linked_mobile").set(deviceData, SetOptions.merge())
        } catch (e: Exception) {
            Log.w(TAG, "syncLinkedDeviceState error: ${e.message}")
            onComplete?.invoke(false)
        }
    }

    /**
     * Dispatch an immediate live update ping to linked mobile and confirm in status bar
     */
    fun dispatchSyncPing(context: Context, onComplete: ((Boolean) -> Unit)? = null) {
        val currentUid = getOrCreateDeviceUid(context)
        val linkedMobile = getLinkedMobile(context)
        val cleanPhone = linkedMobile.filter { it.isDigit() }
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
        val notifId = "notif_sync_${System.currentTimeMillis()}"

        val title = "⚡ Linked Mobile Updated"
        val message = "Your mobile device ($linkedMobile) is updated! Live Fashion Challenge votes & entries synchronized."

        val notifData = hashMapOf(
            "id" to notifId,
            "userId" to currentUid,
            "userName" to "BuyWise Shopper",
            "linkedMobile" to linkedMobile,
            "type" to "DEVICE_STATE_SYNC",
            "title" to title,
            "message" to message,
            "status" to "ONLINE",
            "read" to false,
            "createdAt" to now,
            "deliveredToMobile" to true,
            "channel" to "FCM_MOBILE_PUSH"
        )

        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("user_notifications").document(notifId).set(notifData)

            if (cleanPhone.isNotBlank()) {
                val devUpdate = hashMapOf(
                    "status" to "ONLINE",
                    "linkedMobile" to linkedMobile,
                    "lastSyncedAt" to now,
                    "command" to "FORCE_UPDATE",
                    "lastNotification" to hashMapOf(
                        "id" to notifId,
                        "title" to title,
                        "message" to message,
                        "createdAt" to now
                    )
                )
                db.collection("user_devices").document("mobile_$cleanPhone").set(devUpdate, SetOptions.merge())
                db.collection("user_devices").document("device_$currentUid").set(devUpdate, SetOptions.merge())
            }

            syncLinkedDeviceState(context) { success ->
                showNotification(
                    context = context,
                    title = title,
                    message = message,
                    type = "DEVICE_STATE_SYNC",
                    targetRoute = "alerts",
                    notificationId = notifId.hashCode()
                )
                onComplete?.invoke(success)
            }
        } catch (e: Exception) {
            Log.w(TAG, "dispatchSyncPing error: ${e.message}")
            showNotification(
                context = context,
                title = title,
                message = message,
                type = "DEVICE_STATE_SYNC",
                targetRoute = "alerts"
            )
            onComplete?.invoke(false)
        }
    }

    /**
     * Display a rich, heads-up system notification on the mobile device
     */
    fun showNotification(
        context: Context,
        title: String,
        message: String,
        type: String = "VOTE_RECEIVED",
        targetRoute: String = "competition",
        notificationId: Int = (System.currentTimeMillis() % 100000).toInt()
    ) {
        // Check Android 13 POST_NOTIFICATIONS permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted. Skipping notification display.")
                return
            }
        }

        val channelId = if (type.contains("PRICE") || type.contains("DROP")) CHANNEL_ALERTS else CHANNEL_COMPETITION

        // Deep link into MainActivity with the target route
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("deep_link_route", targetRoute)
            putExtra("notification_type", type)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        try {
            val manager = NotificationManagerCompat.from(context)
            manager.notify(notificationId, builder.build())
            Log.i(TAG, "System Notification posted: \"$title\" -> \"$message\"")
        } catch (e: SecurityException) {
            Log.w(TAG, "SecurityException while notifying: ${e.message}")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to display notification: ${e.message}")
        }
    }

    /**
     * Dispatch an immediate vote notification to the entry author and their linked mobile
     */
    /**
     * Dispatches a reminder to vote in the active competition ONLY IF:
     * 1. The user has NOT voted yet.
     * 2. A reminder has NOT already been sent for this competition.
     * If already sent or already voted, it strictly does not send any reminder.
     */
    fun checkAndDispatchVotingReminder(
        context: Context,
        competitionId: String,
        competitionTitle: String = "Weekly Fashion Challenge"
    ): Boolean {
        val prefs = context.getSharedPreferences("buywise_competition_prefs", Context.MODE_PRIVATE)
        val voterId = getOrCreateDeviceUid(context)

        // 1. Check if user already voted in this competition
        val alreadyVoted = prefs.getString("voted_sub_$competitionId", null) != null ||
                com.pajonline.buywiseai.data.repository.CompetitionRepository.hasVoted(competitionId, voterId)

        if (alreadyVoted) {
            Log.i(TAG, "User has already voted in competition $competitionId. Suppressing voting reminder.")
            return false
        }

        // 2. Check if reminder was already sent for this competition
        val reminderSentKey = "voting_reminder_sent_$competitionId"
        val alreadySent = prefs.getBoolean(reminderSentKey, false)
        if (alreadySent) {
            Log.i(TAG, "Voting reminder already sent previously for competition $competitionId. Suppressing duplicate reminder.")
            return false
        }

        // 3. Mark as sent immediately to guarantee idempotency (never send again)
        prefs.edit().putBoolean(reminderSentKey, true).apply()

        // 4. Dispatch the single voting reminder
        val title = "🗳️ Vote for Your Favorite Look!"
        val message = "Community voting is live for \"$competitionTitle\". Check out the trending styles and cast your vote today!"
        val notifId = "notif_vote_remind_${competitionId.hashCode()}"

        recordProcessedNotificationId(context, notifId)

        showNotification(
            context = context,
            title = title,
            message = message,
            type = "VOTING_REMINDER",
            targetRoute = "competition",
            notificationId = notifId.hashCode()
        )

        Log.i(TAG, "Dispatched initial voting reminder for $competitionId.")
        return true
    }

    fun dispatchVoteNotification(
        context: Context,
        submissionId: String,
        recipientUserId: String,
        recipientUserName: String,
        newVoteCount: Int,
        competitionTitle: String = "Weekly Fashion Challenge",
        linkedMobile: String? = null
    ) {
        val targetPhone = linkedMobile?.takeIf { it.isNotBlank() } ?: getLinkedMobile(context)
        val cleanPhone = targetPhone.filter { it.isDigit() }
        val title = "❤️ New Vote Received!"
        val message = "Someone just voted for your look in $competitionTitle! You now have $newVoteCount votes! 🌟"
        val notifId = "notif_vote_${submissionId}_$newVoteCount"
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        if (isNotificationAlreadyProcessed(context, notifId)) {
            Log.i(TAG, "Vote notification $notifId already processed. Suppressing duplicate message.")
            return
        }
        recordProcessedNotificationId(context, notifId)

        val notifData = hashMapOf(
            "id" to notifId,
            "userId" to recipientUserId,
            "userName" to recipientUserName,
            "linkedMobile" to targetPhone,
            "type" to "VOTE_RECEIVED",
            "title" to title,
            "message" to message,
            "submissionId" to submissionId,
            "voteCount" to newVoteCount,
            "read" to false,
            "createdAt" to now,
            "deliveredToMobile" to true,
            "channel" to "FCM_MOBILE_PUSH"
        )

        // Write to Firestore so the user's active device receives it immediately via snapshot listener
        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("user_notifications").document(notifId).set(notifData)

            if (cleanPhone.isNotBlank()) {
                val devUpdate = hashMapOf(
                    "status" to "ONLINE",
                    "linkedMobile" to targetPhone,
                    "lastSyncedAt" to now,
                    "lastVoteNotificationId" to notifId
                )
                db.collection("user_devices").document("mobile_$cleanPhone").set(devUpdate, SetOptions.merge())
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firestore notification note: ${e.message}")
        }

        // Show local heads-up notification immediately
        showNotification(
            context = context,
            title = title,
            message = message,
            type = "VOTE_RECEIVED",
            targetRoute = "competition"
        )
    }

    /**
     * Dispatch an immediate entry approval or rejection notification to the candidate's linked mobile
     */
    fun dispatchApprovalNotification(
        context: Context,
        submissionId: String,
        recipientUserId: String,
        recipientUserName: String,
        isApproved: Boolean,
        rejectionReason: String? = null,
        competitionTitle: String = "Weekly Fashion Challenge",
        linkedMobile: String? = null
    ) {
        val targetPhone = linkedMobile?.takeIf { it.isNotBlank() } ?: getLinkedMobile(context)
        val cleanPhone = targetPhone.filter { it.isDigit() }
        val title = if (isApproved) "🎉 Your Challenge Entry is Approved!" else "⚠️ Challenge Entry Update"
        val message = if (isApproved) {
            "Congratulations $recipientUserName! Your look for \"$competitionTitle\" is approved & live for public voting."
        } else {
            "Your entry needs revision: ${rejectionReason ?: "Guidelines not met"}. Please review rules and try again."
        }
        val notifId = "notif_appr_${System.currentTimeMillis()}"
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        val notifData = hashMapOf(
            "id" to notifId,
            "userId" to recipientUserId,
            "userName" to recipientUserName,
            "linkedMobile" to targetPhone,
            "type" to if (isApproved) "ENTRY_APPROVED" else "ENTRY_REJECTED",
            "title" to title,
            "message" to message,
            "submissionId" to submissionId,
            "status" to if (isApproved) "APPROVED" else "REJECTED",
            "read" to false,
            "createdAt" to now,
            "deliveredToMobile" to true,
            "channel" to "FCM_MOBILE_PUSH"
        )

        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("user_notifications").document(notifId).set(notifData)

            if (cleanPhone.isNotBlank()) {
                val devUpdate = hashMapOf(
                    "status" to "ONLINE",
                    "linkedMobile" to targetPhone,
                    "lastSyncedAt" to now,
                    "lastVoteNotificationId" to notifId
                )
                db.collection("user_devices").document("mobile_$cleanPhone").set(devUpdate, SetOptions.merge())
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firestore notification note: ${e.message}")
        }

        showNotification(
            context = context,
            title = title,
            message = message,
            type = if (isApproved) "ENTRY_APPROVED" else "ENTRY_REJECTED",
            targetRoute = "competition"
        )
    }

    /**
     * Dispatch an immediate entry & YouTube update notification to the candidate's linked mobile
     */
    fun dispatchEntryUpdatedNotification(
        context: Context,
        submissionId: String,
        recipientUserId: String,
        recipientUserName: String,
        competitionTitle: String = "Weekly Fashion Challenge",
        youtubeUrl: String? = null,
        linkedMobile: String? = null
    ) {
        val targetPhone = linkedMobile?.takeIf { it.isNotBlank() } ?: getLinkedMobile(context)
        val cleanPhone = targetPhone.filter { it.isDigit() }
        val title = "⚡ Entry & YouTube Video Updated"
        val message = "$recipientUserName, your challenge look and YouTube reel for \"$competitionTitle\" have been updated and synchronized with your linked mobile!"
        val notifId = "notif_update_${System.currentTimeMillis()}"
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())

        val notifData = hashMapOf(
            "id" to notifId,
            "userId" to recipientUserId,
            "userName" to recipientUserName,
            "linkedMobile" to targetPhone,
            "type" to "ENTRY_UPDATED",
            "title" to title,
            "message" to message,
            "submissionId" to submissionId,
            "youtubeUrl" to (youtubeUrl ?: ""),
            "status" to "APPROVED",
            "read" to false,
            "createdAt" to now,
            "deliveredToMobile" to true,
            "channel" to "FCM_MOBILE_PUSH"
        )

        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("user_notifications").document(notifId).set(notifData)

            if (cleanPhone.isNotBlank()) {
                val devUpdate = hashMapOf(
                    "status" to "ONLINE",
                    "linkedMobile" to targetPhone,
                    "lastSyncedAt" to now,
                    "lastVoteNotificationId" to notifId
                )
                db.collection("user_devices").document("mobile_$cleanPhone").set(devUpdate, SetOptions.merge())
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firestore notification note: ${e.message}")
        }

        showNotification(
            context = context,
            title = title,
            message = message,
            type = "ENTRY_UPDATED",
            targetRoute = "competition"
        )
    }
}

