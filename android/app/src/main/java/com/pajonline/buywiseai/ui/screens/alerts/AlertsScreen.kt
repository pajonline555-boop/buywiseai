package com.pajonline.buywiseai.ui.screens.alerts

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink

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

@Composable
fun AlertsScreen(
    onNavigateToChallenge: () -> Unit = {}
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE) }

    var selectedTabIndex by remember { mutableStateOf(0) } // 0: Competition & Votes, 1: Price Trackers

    var showAddDialog by remember { mutableStateOf(false) }
    var newAlertQuery by remember { mutableStateOf("") }
    var newTargetPrice by remember { mutableStateOf("") }

    var pushEnabled by remember { mutableStateOf(true) }
    var whatsappEnabled by remember { mutableStateOf(true) }

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
        mutableStateOf(
            listOf(
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
        )
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
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Alerts & Notifications",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Live Real-Time Votes, Challenge & Approval Updates",
                        fontSize = 11.sp,
                        color = BuyWiseEmerald,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = {
                        BuyWiseNotificationManager.showNotification(
                            context = context,
                            title = "🔔 BuyWise Live Alert System",
                            message = "Real-time notifications & live voting sync are active!",
                            type = "TEST_NOTIFICATION",
                            targetRoute = "alerts"
                        )
                        Toast.makeText(context, "Test alert dispatched to status bar!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Notifications, contentDescription = "Test", tint = Color.Black, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Test Alert", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

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

            Spacer(modifier = Modifier.height(14.dp))

            // TAB CONTENT
            if (selectedTabIndex == 0) {
                // TAB 0: COMPETITION & VOTE NOTIFICATIONS
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(liveNotifications) { item ->
                        val isVote = item.type.contains("VOTE")
                        val isApproved = item.type.contains("APPROVE")

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateToChallenge() },
                            colors = CardDefaults.cardColors(
                                containerColor = if (isVote) Color(0xFF261226) else if (isApproved) Color(0xFF10261E) else Color(0xFF16122B)
                            ),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(
                                1.dp,
                                if (isVote) BuyWiseNeonPink.copy(alpha = 0.5f) else if (isApproved) BuyWiseEmerald.copy(alpha = 0.5f) else BuyWiseCyan.copy(alpha = 0.3f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (isVote) BuyWiseNeonPink else if (isApproved) BuyWiseEmerald else Color.White
                                    )

                                    Box(
                                        modifier = Modifier
                                            .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(item.timestamp, fontSize = 9.5.sp, color = Color.LightGray)
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = item.message,
                                    fontSize = 12.sp,
                                    color = Color.LightGray,
                                    lineHeight = 16.sp
                                )

                                Spacer(modifier = Modifier.height(8.dp))

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

                                    Text(
                                        text = "Tap to View Look →",
                                        fontSize = 10.sp,
                                        color = BuyWiseCyan,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                // TAB 1: PRICE TRACKERS
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "YOUR ACTIVE TRACKERS",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.Gray,
                        letterSpacing = 1.sp
                    )

                    Button(
                        onClick = { showAddDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.Black, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("+ New Tracker", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(alertList) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (item.isTriggered) Color(0xFF26152B) else Color(0xFF16122B)
                            ),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(
                                1.dp,
                                if (item.isTriggered) BuyWiseNeonPink.copy(alpha = 0.8f) else BuyWiseCyan.copy(alpha = 0.25f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
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
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("🔥 DROP DETECTED", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Current: ${item.currentPrice}", fontSize = 12.sp, color = Color.LightGray)
                                    Text("Target Alert: ${item.targetPrice}", fontSize = 12.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = item.statusText,
                                    fontSize = 11.sp,
                                    color = if (item.isTriggered) BuyWiseNeonPink else BuyWiseEmerald,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }



    // Modal to create custom price alert
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            containerColor = Color(0xFF141026),
            title = {
                Text("🔔 Create Price Alert", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column {
                    Text("Enter product name or URL:", fontSize = 12.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newAlertQuery,
                        onValueChange = { newAlertQuery = it },
                        placeholder = { Text("e.g. Sony WH-1000XM5", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BuyWiseCyan, unfocusedBorderColor = Color.DarkGray, focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("Target Alert Price (₹):", fontSize = 12.sp, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newTargetPrice,
                        onValueChange = { newTargetPrice = it },
                        placeholder = { Text("e.g. 22999", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BuyWiseCyan, unfocusedBorderColor = Color.DarkGray, focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newAlertQuery.isNotBlank()) {
                            alertList = alertList + ActiveAlertItem(
                                id = System.currentTimeMillis().toString(),
                                title = newAlertQuery,
                                currentPrice = "₹" + (newTargetPrice.toIntOrNull()?.let { (it * 1.1).toInt() } ?: 9999),
                                targetPrice = "₹" + (newTargetPrice.ifBlank { "4999" }),
                                store = "All 14 Major Retailers",
                                statusText = "🔔 Monitoring live price feeds...",
                                isTriggered = false
                            )
                        }
                        showAddDialog = false
                        newAlertQuery = ""
                        newTargetPrice = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                ) {
                    Text("CREATE TRACKER", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                Button(
                    onClick = { showAddDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                ) {
                    Text("CANCEL", color = Color.White)
                }
            }
        )
    }
}
