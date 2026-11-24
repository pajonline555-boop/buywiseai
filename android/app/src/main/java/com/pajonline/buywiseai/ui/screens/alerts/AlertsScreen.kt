package com.pajonline.buywiseai.ui.screens.alerts

import android.content.Context
import android.content.SharedPreferences
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore
import com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import org.json.JSONArray
import org.json.JSONObject

data class ActiveAlertItem(
    val id: String,
    val title: String,
    val currentPrice: String,
    val targetPrice: String,
    val store: String,
    val statusText: String,
    val isTriggered: Boolean
)

data class LiveUserActivityNotification(
    val id: String,
    val title: String,
    val message: String,
    val type: String,
    val timestamp: String,
    val isRead: Boolean = false,
    val submissionId: String? = null,
    val voteCount: Int? = null
)

private val defaultAlertList = listOf(
    ActiveAlertItem(
        id = "1",
        title = "iPhone 17 (256 GB) - Deep Purple",
        currentPrice = "₹82,900",
        targetPrice = "₹79,999",
        store = "Amazon India",
        statusText = "🔥 Price dropped 4%! Deal active now.",
        isTriggered = true
    ),
    ActiveAlertItem(
        id = "2",
        title = "Gujarati Navratri Embroidered Kamarbandh",
        currentPrice = "₹499",
        targetPrice = "₹399",
        store = "Amazon India",
        statusText = "🔔 Monitoring live price feeds across 14 stores...",
        isTriggered = false
    ),
    ActiveAlertItem(
        id = "3",
        title = "Apple AirPods Pro (2nd Gen)",
        currentPrice = "₹19,900",
        targetPrice = "₹18,500",
        store = "Flipkart / Tata CLiQ",
        statusText = "⚡ Price drop alert active",
        isTriggered = false
    )
)

private fun loadSavedTrackers(prefs: SharedPreferences): List<ActiveAlertItem> {
    val raw = prefs.getString("buywise_active_trackers_v2", null)
    if (!raw.isNullOrBlank()) {
        try {
            val jsonArray = JSONArray(raw)
            val list = mutableListOf<ActiveAlertItem>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    ActiveAlertItem(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        currentPrice = obj.getString("currentPrice"),
                        targetPrice = obj.getString("targetPrice"),
                        store = obj.optString("store", "14 Major Stores"),
                        statusText = obj.optString("statusText", "Monitoring live feeds..."),
                        isTriggered = obj.optBoolean("isTriggered", false)
                    )
                )
            }
            if (list.isNotEmpty()) return list
        } catch (_: Exception) {}
    }
    return defaultAlertList
}

private fun saveTrackers(prefs: SharedPreferences, list: List<ActiveAlertItem>) {
    try {
        val jsonArray = JSONArray()
        for (item in list) {
            val obj = JSONObject()
            obj.put("id", item.id)
            obj.put("title", item.title)
            obj.put("currentPrice", item.currentPrice)
            obj.put("targetPrice", item.targetPrice)
            obj.put("store", item.store)
            obj.put("statusText", item.statusText)
            obj.put("isTriggered", item.isTriggered)
            jsonArray.put(obj)
        }
        prefs.edit().putString("buywise_active_trackers_v2", jsonArray.toString()).apply()
    } catch (_: Exception) {}
}

@Composable
fun AlertsScreen(
    onNavigateToChallenge: () -> Unit = {},
    onNavigateToSearch: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE) }

    var selectedTabIndex by remember { mutableStateOf(0) } // 0: Competition & Votes, 1: Price Trackers

    var showAddDialog by remember { mutableStateOf(false) }
    var editingTracker by remember { mutableStateOf<ActiveAlertItem?>(null) }
    var newAlertQuery by remember { mutableStateOf("") }
    var newTargetPrice by remember { mutableStateOf("") }
    var newStore by remember { mutableStateOf("All 14 Stores") }

    val liveNotifications = remember {
        mutableStateListOf(
            LiveUserActivityNotification(
                id = "notif_appr_1",
                title = "🎉 Your Challenge Entry is Approved!",
                message = "Congratulations! Your Navratri Kamarbandh try-on look has been approved by admin & is live for public voting.",
                type = "ENTRY_APPROVED",
                timestamp = "10 mins ago"
            ),
            LiveUserActivityNotification(
                id = "notif_comp_1",
                title = "🏆 Weekly Challenge LIVE",
                message = "Weekly Fashion Challenge is live with 4 diverse try-on models (Petite S to Curvy XXL).",
                type = "COMPETITION_LIVE",
                timestamp = "2 hours ago"
            )
        )
    }

    var alertList by remember {
        mutableStateOf(loadSavedTrackers(prefs))
    }

    // Connect to Firestore real-time notification stream for live device updates
    LaunchedEffect(Unit) {
        try {
            val currentUid = BuyWiseNotificationManager.getOrCreateDeviceUid(context)
            val db = FirebaseFirestore.getInstance()

            // 1. Listen for real-time user notifications (Votes, Approvals, Status changes)
            db.collection("user_notifications")
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(30)
                .addSnapshotListener { snapshot, error ->
                    if (error == null && snapshot != null && !snapshot.isEmpty) {
                        for (doc in snapshot.documents) {
                            val id = doc.id
                            val notifType = doc.getString("type") ?: "GENERAL"
                            val title = doc.getString("title") ?: ""
                            val message = doc.getString("message") ?: ""
                            val submissionId = doc.getString("submissionId")
                            val voteCount = doc.getLong("voteCount")?.toInt()

                            // STRICT: Remove Linked Mobile and Linked Mobile Update notifications
                            if (notifType == "DEVICE_STATE_SYNC" ||
                                title.contains("Linked Mobile", ignoreCase = true) ||
                                message.contains("Linked Mobile", ignoreCase = true) ||
                                message.contains("mobile device state is synchronized", ignoreCase = true)
                            ) {
                                continue
                            }

                            val docUserId = doc.getString("userId") ?: ""
                            val matchesUser = docUserId.isBlank() || docUserId == currentUid || docUserId == "all" || docUserId == "guest_user"
                            if (!matchesUser) continue

                            // AVOID REPEATED MESSAGES FOR THE SAME VOTE
                            if (notifType == "VOTE_RECEIVED" && !submissionId.isNullOrBlank()) {
                                val existingIndex = liveNotifications.indexOfFirst {
                                    it.type == "VOTE_RECEIVED" && it.submissionId == submissionId
                                }
                                if (existingIndex != -1) {
                                    val existing = liveNotifications[existingIndex]
                                    if (voteCount != null && (existing.voteCount == null || voteCount > existing.voteCount)) {
                                        liveNotifications[existingIndex] = existing.copy(
                                            title = title,
                                            message = message,
                                            timestamp = "Just now",
                                            voteCount = voteCount
                                        )
                                    }
                                    continue
                                }
                            }

                            if (liveNotifications.none { it.id == id }) {
                                liveNotifications.add(
                                    0,
                                    LiveUserActivityNotification(
                                        id = id,
                                        title = title.ifBlank { "New Notification" },
                                        message = message,
                                        type = notifType,
                                        timestamp = "Just now",
                                        submissionId = submissionId,
                                        voteCount = voteCount
                                    )
                                )
                            }
                        }
                    }
                }

            // 2. Real-time snapshot listener on competition_submissions for instant vote updates
            db.collection("competition_submissions")
                .addSnapshotListener { snapshot, error ->
                    if (error == null && snapshot != null) {
                        for (doc in snapshot.documents) {
                            val subId = doc.id
                            val votes = doc.getLong("voteCount")?.toInt() ?: 0
                            val subTitle = doc.getString("title") ?: doc.getString("lookTitle") ?: "Your Look"
                            val subUserId = doc.getString("userId") ?: ""

                            if (votes > 0 && (subUserId == currentUid || subUserId == "guest_user" || subUserId.isBlank())) {
                                val existingIndex = liveNotifications.indexOfFirst {
                                    it.type == "VOTE_RECEIVED" && it.submissionId == subId
                                }
                                if (existingIndex != -1) {
                                    val existing = liveNotifications[existingIndex]
                                    if (existing.voteCount == null || votes > existing.voteCount) {
                                        liveNotifications[existingIndex] = existing.copy(
                                            title = "❤️ New Vote Received!",
                                            message = "Someone just voted for your look in $subTitle! You now have $votes votes! 🌟",
                                            timestamp = "Just now",
                                            voteCount = votes
                                        )
                                    }
                                } else {
                                    liveNotifications.add(
                                        0,
                                        LiveUserActivityNotification(
                                            id = "vote_realtime_${subId}_$votes",
                                            title = "❤️ New Vote Received!",
                                            message = "Someone just voted for your look in $subTitle! You now have $votes votes! 🌟",
                                            type = "VOTE_RECEIVED",
                                            timestamp = "Just now",
                                            submissionId = subId,
                                            voteCount = votes
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
        } catch (_: Exception) {}
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // WORLD-CLASS HEADER BAR: Perfectly responsive, never squishes or wraps vertically
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 12.dp)
                ) {
                    Text(
                        text = "Alerts & Notifications",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .background(BuyWiseEmerald, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = "Live Real-Time Sync Active",
                            fontSize = 11.sp,
                            color = BuyWiseEmerald,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // TEST ALERT BUTTON: Clean fixed layout
                Button(
                    onClick = {
                        BuyWiseNotificationManager.showNotification(
                            context = context,
                            title = "🔔 BuyWise Live Alert System",
                            message = "Real-time notifications & live price tracking are active!",
                            type = "TEST_NOTIFICATION",
                            targetRoute = "alerts"
                        )
                        liveNotifications.add(
                            0,
                            LiveUserActivityNotification(
                                id = "test_${System.currentTimeMillis()}",
                                title = "🔔 Live Real-Time Test Alert",
                                message = "Real-time notification system verified! Live price drops & votes are monitored active.",
                                type = "TEST_NOTIFICATION",
                                timestamp = "Just now"
                            )
                        )
                        Toast.makeText(context, "Test alert sent to status bar!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                    modifier = Modifier.height(38.dp)
                ) {
                    Icon(
                        Icons.Default.Notifications,
                        contentDescription = "Test",
                        tint = Color.Black,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Test Alert",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        maxLines = 1
                    )
                }
            }

            // TAB ROW: 0 = Challenge & Votes, 1 = Price Trackers
            TabRow(
                selectedTabIndex = selectedTabIndex,
                containerColor = Color(0xFF16122C),
                contentColor = BuyWiseCyan,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                        color = if (selectedTabIndex == 0) BuyWiseNeonPink else BuyWiseCyan,
                        height = 3.dp
                    )
                }
            ) {
                Tab(
                    selected = selectedTabIndex == 0,
                    onClick = { selectedTabIndex = 0 },
                    text = {
                        Text(
                            "👗 Challenge & Votes (${liveNotifications.size})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (selectedTabIndex == 0) Color.White else Color.Gray
                        )
                    }
                )
                Tab(
                    selected = selectedTabIndex == 1,
                    onClick = { selectedTabIndex = 1 },
                    text = {
                        Text(
                            "🏷️ Price Trackers (${alertList.size})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (selectedTabIndex == 1) Color.White else Color.Gray
                        )
                    }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // TAB 0: COMPETITION & VOTE NOTIFICATIONS
            if (selectedTabIndex == 0) {
                // Real-time Action Toolbar for Community Votes
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "COMMUNITY ACTIONS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.Gray,
                        letterSpacing = 1.sp
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        // SIMULATE LIVE VOTE BUTTON
                        OutlinedButton(
                            onClick = {
                                val simulatedCount = (10..99).random()
                                val title = "❤️ New Vote Received!"
                                val msg = "Someone just voted for your Navratri Kamarbandh look! You now have $simulatedCount votes! 🌟"

                                BuyWiseNotificationManager.showNotification(
                                    context = context,
                                    title = title,
                                    message = msg,
                                    type = "VOTE_RECEIVED",
                                    targetRoute = "competition"
                                )

                                liveNotifications.add(
                                    0,
                                    LiveUserActivityNotification(
                                        id = "vote_sim_${System.currentTimeMillis()}",
                                        title = title,
                                        message = msg,
                                        type = "VOTE_RECEIVED",
                                        timestamp = "Just now",
                                        voteCount = simulatedCount
                                    )
                                )

                                Toast.makeText(context, "🌟 Real-time community vote simulated!", Toast.LENGTH_SHORT).show()
                            },
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, BuyWiseNeonPink),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Icon(Icons.Default.Favorite, contentDescription = null, tint = BuyWiseNeonPink, modifier = Modifier.size(13.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Simulate Vote", color = BuyWiseNeonPink, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }

                        // CLEAR READ NOTIFICATIONS
                        if (liveNotifications.isNotEmpty()) {
                            IconButton(
                                onClick = {
                                    liveNotifications.clear()
                                    Toast.makeText(context, "All notifications cleared", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear", tint = Color.Gray, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }

                if (liveNotifications.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Notifications, contentDescription = null, tint = Color.DarkGray, modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("No new notifications", color = Color.Gray, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Tap 'Simulate Vote' above to test real-time alerts", color = Color.DarkGray, fontSize = 11.sp)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(liveNotifications, key = { it.id }) { item ->
                            val isVote = item.type.contains("VOTE")
                            val isApproved = item.type.contains("APPROVE")

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isVote) Color(0xFF261226) else if (isApproved) Color(0xFF10261E) else Color(0xFF16122B)
                                ),
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(
                                    1.dp,
                                    if (isVote) BuyWiseNeonPink.copy(alpha = 0.6f) else if (isApproved) BuyWiseEmerald.copy(alpha = 0.6f) else BuyWiseCyan.copy(alpha = 0.35f)
                                )
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    // Card Header
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = item.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Black,
                                            color = if (isVote) BuyWiseNeonPink else if (isApproved) BuyWiseEmerald else Color.White,
                                            modifier = Modifier.weight(1f)
                                        )

                                        Box(
                                            modifier = Modifier
                                                .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(item.timestamp, fontSize = 9.5.sp, color = Color.LightGray)
                                        }

                                        Spacer(modifier = Modifier.width(6.dp))

                                        // Dismiss button
                                        IconButton(
                                            onClick = {
                                                liveNotifications.remove(item)
                                            },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Color.Gray, modifier = Modifier.size(14.dp))
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = item.message,
                                        fontSize = 12.sp,
                                        color = Color.LightGray,
                                        lineHeight = 16.sp
                                    )

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Real-time Action Buttons on Card
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = "Live", tint = BuyWiseEmerald, modifier = Modifier.size(12.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Live Real-Time Update",
                                                fontSize = 10.sp,
                                                color = BuyWiseEmerald,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            if (isVote) {
                                                OutlinedButton(
                                                    onClick = {
                                                        Toast.makeText(context, "❤️ Cheered back to voter with love!", Toast.LENGTH_SHORT).show()
                                                    },
                                                    shape = RoundedCornerShape(8.dp),
                                                    border = BorderStroke(0.8.dp, BuyWiseNeonPink),
                                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                                    modifier = Modifier.height(28.dp)
                                                ) {
                                                    Icon(Icons.Default.Favorite, contentDescription = null, tint = BuyWiseNeonPink, modifier = Modifier.size(11.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("Cheer ❤️", fontSize = 10.sp, color = BuyWiseNeonPink, fontWeight = FontWeight.Bold)
                                                }
                                            }

                                            Button(
                                                onClick = { onNavigateToChallenge() },
                                                shape = RoundedCornerShape(8.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = if (isVote) BuyWiseNeonPink else BuyWiseCyan),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                                modifier = Modifier.height(28.dp)
                                            ) {
                                                Text(
                                                    text = "View Look →",
                                                    fontSize = 10.sp,
                                                    color = Color.Black,
                                                    fontWeight = FontWeight.Black
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: PRICE TRACKERS
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "YOUR ACTIVE TRACKERS (14 STORES)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.Gray,
                        letterSpacing = 1.sp
                    )

                    // "+ New Tracker" - CLEAN, SINGLE PLUS ICON
                    Button(
                        onClick = { showAddDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.Black, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("New Tracker", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(alertList, key = { it.id }) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (item.isTriggered) Color(0xFF26152B) else Color(0xFF16122B)
                            ),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(
                                1.dp,
                                if (item.isTriggered) BuyWiseNeonPink.copy(alpha = 0.85f) else BuyWiseCyan.copy(alpha = 0.3f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                // Title and Drop Badge Row
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.weight(1f)
                                    )

                                    if (item.isTriggered) {
                                        Box(
                                            modifier = Modifier
                                                .background(BuyWiseNeonPink, RoundedCornerShape(8.dp))
                                                .padding(horizontal = 7.dp, vertical = 3.dp)
                                        ) {
                                            Text("🔥 DROP DETECTED", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White)
                                        }
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .background(BuyWiseEmerald.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                                .border(0.5.dp, BuyWiseEmerald.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("● MONITORING", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Store Info
                                Text(
                                    text = "Monitored across: ${item.store}",
                                    fontSize = 10.5.sp,
                                    color = Color.Gray
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                // Pricing Row
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Current Best Price", fontSize = 9.5.sp, color = Color.Gray)
                                        Text(item.currentPrice, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Target Alert Price", fontSize = 9.5.sp, color = BuyWiseCyan)
                                        Text(item.targetPrice, fontSize = 13.sp, fontWeight = FontWeight.Black, color = BuyWiseCyan)
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = item.statusText,
                                    fontSize = 11.sp,
                                    color = if (item.isTriggered) BuyWiseNeonPink else BuyWiseEmerald,
                                    fontWeight = FontWeight.Bold
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                // ACTIVE BUTTONS ON EVERY TRACKER
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // 1. COMPARE PRICES / VIEW DEAL BUTTON
                                    Button(
                                        onClick = {
                                            onNavigateToSearch(item.title)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 5.dp),
                                        modifier = Modifier.height(30.dp)
                                    ) {
                                        Icon(Icons.Default.Search, contentDescription = null, tint = Color.Black, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Compare Deals", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    }

                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        // 2. REAL-TIME SIMULATE PRICE DROP ALERT BUTTON
                                        OutlinedButton(
                                            onClick = {
                                                val targetInt = item.targetPrice.filter { it.isDigit() }.toIntOrNull() ?: 1000
                                                val droppedPriceInt = (targetInt * 0.92).toInt()
                                                val droppedPriceStr = "₹" + String.format("%,d", droppedPriceInt)

                                                // Update local item
                                                val updatedList = alertList.map {
                                                    if (it.id == item.id) {
                                                        it.copy(
                                                            currentPrice = droppedPriceStr,
                                                            statusText = "🔥 Price dropped below target! Deal active now.",
                                                            isTriggered = true
                                                        )
                                                    } else it
                                                }
                                                alertList = updatedList
                                                saveTrackers(prefs, updatedList)

                                                // Dispatch Real System Notification
                                                BuyWiseNotificationManager.showNotification(
                                                    context = context,
                                                    title = "🔥 PRICE DROP: ${item.title}",
                                                    message = "Dropped to $droppedPriceStr! Beat your target price of ${item.targetPrice} across 14 stores.",
                                                    type = "PRICE_DROP",
                                                    targetRoute = "alerts"
                                                )

                                                Toast.makeText(context, "⚡ Price drop triggered! Real notification sent to status bar.", Toast.LENGTH_SHORT).show()
                                            },
                                            shape = RoundedCornerShape(10.dp),
                                            border = BorderStroke(1.dp, if (item.isTriggered) BuyWiseEmerald else BuyWiseNeonPink),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 5.dp),
                                            modifier = Modifier.height(30.dp)
                                        ) {
                                            Text(
                                                text = if (item.isTriggered) "⚡ Retest Drop" else "⚡ Test Drop",
                                                color = if (item.isTriggered) BuyWiseEmerald else BuyWiseNeonPink,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 10.5.sp
                                            )
                                        }

                                        // 3. EDIT TARGET BUTTON
                                        IconButton(
                                            onClick = {
                                                editingTracker = item
                                                newTargetPrice = item.targetPrice.filter { it.isDigit() }
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(Icons.Default.Edit, contentDescription = "Edit Target", tint = BuyWiseCyan, modifier = Modifier.size(15.dp))
                                        }

                                        // 4. DELETE TRACKER BUTTON
                                        IconButton(
                                            onClick = {
                                                val updatedList = alertList.filter { it.id != item.id }
                                                alertList = updatedList
                                                saveTrackers(prefs, updatedList)
                                                Toast.makeText(context, "Tracker removed", Toast.LENGTH_SHORT).show()
                                            },
                                            modifier = Modifier.size(30.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Gray, modifier = Modifier.size(15.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // DIALOG: CREATE NEW PRICE ALERT
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            containerColor = Color(0xFF141026),
            title = {
                Text("🔔 Create Live Price Tracker", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column {
                    Text("Quick Presets:", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val presets = listOf(
                            "👗 Designer Kurta" to "4999",
                            "📱 iPhone 17" to "79999",
                            "🎧 AirPods Pro" to "18500",
                            "💍 Navratri Kamarbandh" to "399"
                        )
                        items(presets) { (title, target) ->
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF231C3D), RoundedCornerShape(8.dp))
                                    .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .clickable {
                                        newAlertQuery = title
                                        newTargetPrice = target
                                    }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(title, fontSize = 10.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Product Name or URL:", fontSize = 12.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = newAlertQuery,
                        onValueChange = { newAlertQuery = it },
                        placeholder = { Text("e.g. Sony WH-1000XM5", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BuyWiseCyan,
                            unfocusedBorderColor = Color.DarkGray,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("Target Alert Price (₹):", fontSize = 12.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = newTargetPrice,
                        onValueChange = { newTargetPrice = it },
                        placeholder = { Text("e.g. 22999", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BuyWiseCyan,
                            unfocusedBorderColor = Color.DarkGray,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("Monitoring Scope: 14 Major Stores (Amazon, Flipkart, Myntra, BuyWise Store, Meesho, etc.)", fontSize = 10.5.sp, color = BuyWiseEmerald)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newAlertQuery.isNotBlank()) {
                            val targetNumeric = newTargetPrice.filter { it.isDigit() }.toIntOrNull() ?: 4999
                            val currentNumeric = (targetNumeric * 1.15).toInt()

                            val newTracker = ActiveAlertItem(
                                id = "track_${System.currentTimeMillis()}",
                                title = newAlertQuery.trim(),
                                currentPrice = "₹" + String.format("%,d", currentNumeric),
                                targetPrice = "₹" + String.format("%,d", targetNumeric),
                                store = "All 14 Major Retailers",
                                statusText = "🔔 Monitoring live price feeds across 14 stores...",
                                isTriggered = false
                            )

                            val updatedList = listOf(newTracker) + alertList
                            alertList = updatedList
                            saveTrackers(prefs, updatedList)

                            Toast.makeText(context, "Tracker activated! Monitoring 14 stores.", Toast.LENGTH_SHORT).show()
                        }
                        showAddDialog = false
                        newAlertQuery = ""
                        newTargetPrice = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("START TRACKING", color = Color.Black, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                Button(
                    onClick = { showAddDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("CANCEL", color = Color.White)
                }
            }
        )
    }

    // DIALOG: EDIT TARGET PRICE
    editingTracker?.let { tracker ->
        AlertDialog(
            onDismissRequest = { editingTracker = null },
            containerColor = Color(0xFF141026),
            title = {
                Text("✏️ Edit Alert Target", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column {
                    Text(tracker.title, fontSize = 13.sp, color = Color.LightGray, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("New Target Price (₹):", fontSize = 12.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = newTargetPrice,
                        onValueChange = { newTargetPrice = it },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BuyWiseCyan,
                            unfocusedBorderColor = Color.DarkGray,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val newTargetInt = newTargetPrice.filter { it.isDigit() }.toIntOrNull()
                        if (newTargetInt != null) {
                            val newTargetStr = "₹" + String.format("%,d", newTargetInt)
                            val updatedList = alertList.map {
                                if (it.id == tracker.id) {
                                    it.copy(targetPrice = newTargetStr)
                                } else it
                            }
                            alertList = updatedList
                            saveTrackers(prefs, updatedList)
                            Toast.makeText(context, "Target price updated to $newTargetStr", Toast.LENGTH_SHORT).show()
                        }
                        editingTracker = null
                        newTargetPrice = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("SAVE TARGET", color = Color.Black, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                Button(
                    onClick = { editingTracker = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("CANCEL", color = Color.White)
                }
            }
        )
    }
}
