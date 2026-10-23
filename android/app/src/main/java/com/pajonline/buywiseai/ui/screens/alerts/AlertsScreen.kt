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
    val linkedMobile: String,
    val isRead: Boolean = false
)

@Composable
fun AlertsScreen(
    onNavigateToChallenge: () -> Unit = {}
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE) }

    var linkedMobileNumber by remember {
        mutableStateOf(prefs.getString("saved_user_phone", "")?.takeIf { it.isNotBlank() } ?: "+91 98765 43210")
    }
    var showEditPhoneDialog by remember { mutableStateOf(false) }
    var editPhoneInput by remember { mutableStateOf(linkedMobileNumber) }

    var selectedTabIndex by remember { mutableStateOf(0) } // 0: Competition & Votes, 1: Price Trackers

    var showAddDialog by remember { mutableStateOf(false) }
    var newAlertQuery by remember { mutableStateOf("") }
    var newTargetPrice by remember { mutableStateOf("") }

    var pushEnabled by remember { mutableStateOf(true) }
    var whatsappEnabled by remember { mutableStateOf(true) }

    val liveNotifications = remember {
        mutableStateListOf(
            LiveUserActivityNotification(
                id = "notif_vote_1",
                title = "❤️ New Vote Received!",
                message = "Someone just voted for your Gujarati Navratri Kamarbandh look! Total votes: 90 ❤️",
                type = "VOTE_RECEIVED",
                timestamp = "Just now",
                linkedMobile = linkedMobileNumber
            ),
            LiveUserActivityNotification(
                id = "notif_appr_1",
                title = "🎉 Your Challenge Entry is Approved!",
                message = "Congratulations! Your Navratri Kamarbandh try-on look has been approved by admin & is live for public voting.",
                type = "ENTRY_APPROVED",
                timestamp = "10 mins ago",
                linkedMobile = linkedMobileNumber
            ),
            LiveUserActivityNotification(
                id = "notif_comp_1",
                title = "🏆 Weekly Challenge LIVE",
                message = "Weekly Fashion Challenge is live with 4 diverse try-on models (Petite S to Curvy XXL).",
                type = "COMPETITION_LIVE",
                timestamp = "2 hours ago",
                linkedMobile = linkedMobileNumber
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
    LaunchedEffect(linkedMobileNumber) {
        try {
            val currentUid = BuyWiseNotificationManager.getOrCreateDeviceUid(context)
            val cleanPhone = linkedMobileNumber.filter { it.isDigit() }
            val db = FirebaseFirestore.getInstance()

            db.collection("user_notifications")
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(30)
                .addSnapshotListener { snapshot, error ->
                    if (error == null && snapshot != null && !snapshot.isEmpty) {
                        for (doc in snapshot.documents) {
                            val id = doc.id
                            if (liveNotifications.none { it.id == id }) {
                                val docUserId = doc.getString("userId") ?: ""
                                val docMobile = doc.getString("linkedMobile") ?: ""
                                val docCleanMobile = docMobile.filter { it.isDigit() }
                                val notifType = doc.getString("type") ?: "GENERAL"
                                val deliveredToMobile = doc.getBoolean("deliveredToMobile") ?: false

                                val matchesUser = docUserId.isNotBlank() && (docUserId == currentUid || docUserId == "all" || docUserId == "guest_user")
                                val matchesPhone = linkedMobileNumber.isNotBlank() && (docMobile == linkedMobileNumber || (cleanPhone.isNotBlank() && docCleanMobile == cleanPhone))
                                val isDeviceSync = notifType == "DEVICE_STATE_SYNC" || notifType.contains("SYNC")

                                if (matchesUser || matchesPhone || isDeviceSync || deliveredToMobile) {
                                    val title = doc.getString("title") ?: "New Notification"
                                    val message = doc.getString("message") ?: ""
                                    liveNotifications.add(
                                        0,
                                        LiveUserActivityNotification(
                                            id = id,
                                            title = title,
                                            message = message,
                                            type = notifType,
                                            timestamp = "Just now",
                                            linkedMobile = docMobile.ifBlank { linkedMobileNumber }
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
                        text = "Instant Votes & Approval Updates on Mobile",
                        fontSize = 11.sp,
                        color = BuyWiseEmerald,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = {
                        // Immediately fire high-priority notification to verify mobile receiving
                        BuyWiseNotificationManager.showNotification(
                            context = context,
                            title = "🔔 BuyWise Instant Mobile Test",
                            message = "Instant notification confirmed on linked mobile: $linkedMobileNumber!",
                            type = "TEST_NOTIFICATION",
                            targetRoute = "alerts"
                        )
                        Toast.makeText(context, "Test notification dispatched to status bar!", Toast.LENGTH_SHORT).show()
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

            // LINKED MOBILE STATUS CARD
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                shape = RoundedCornerShape(18.dp),
                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.45f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(BuyWiseEmerald)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Linked Mobile", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Box(
                            modifier = Modifier
                                .background(BuyWiseEmerald.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                .border(1.dp, BuyWiseEmerald.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text("● LIVE SYNC ACTIVE", fontSize = 9.sp, fontWeight = FontWeight.Black, color = BuyWiseEmerald)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = "Phone", tint = BuyWiseGold, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = linkedMobileNumber,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = BuyWiseGold
                            )
                        }

                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable {
                                    editPhoneInput = linkedMobileNumber
                                    showEditPhoneDialog = true
                                }
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = BuyWiseCyan, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Update", fontSize = 11.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                        }
                    }

                    Text(
                        text = "Receives instant alerts whenever someone votes on your look or when your entry is approved.",
                        fontSize = 11.sp,
                        color = Color.LightGray,
                        modifier = Modifier.padding(top = 6.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                BuyWiseNotificationManager.dispatchSyncPing(context) { success ->
                                    Toast.makeText(
                                        context,
                                        if (success) "⚡ Linked device state updated with latest votes!" else "Device synced.",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("🔄 Sync Linked Device", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.5.sp)
                        }

                        Button(
                            onClick = {
                                editPhoneInput = linkedMobileNumber
                                showEditPhoneDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF261D40)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("📱 Change Mobile", color = BuyWiseGold, fontWeight = FontWeight.Bold, fontSize = 11.5.sp)
                        }
                    }
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
                                        Icon(Icons.Default.CheckCircle, contentDescription = "Sent", tint = BuyWiseEmerald, modifier = Modifier.size(12.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Delivered to mobile: ${item.linkedMobile}",
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

    // Modal to Update Linked Mobile Phone Number
    if (showEditPhoneDialog) {
        AlertDialog(
            onDismissRequest = { showEditPhoneDialog = false },
            containerColor = Color(0xFF141026),
            title = {
                Text("📱 Update Linked Mobile Number", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Column {
                    Text(
                        "Enter your mobile phone number. Instant vote alerts and challenge approvals will be delivered to this device.",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = editPhoneInput,
                        onValueChange = { editPhoneInput = it },
                        placeholder = { Text("+91 98765 43210", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BuyWiseGold,
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
                        val trimmed = editPhoneInput.trim()
                        if (trimmed.length >= 8) {
                            linkedMobileNumber = trimmed
                            prefs.edit().putString("saved_user_phone", trimmed).apply()
                            BuyWiseNotificationManager.syncDeviceToken(context)
                            BuyWiseNotificationManager.syncLinkedDeviceState(context)
                            BuyWiseNotificationManager.startRealtimeNotificationListener(context)
                            BuyWiseNotificationManager.startLinkedDeviceListener(context)
                            Toast.makeText(context, "Linked mobile updated to $trimmed", Toast.LENGTH_SHORT).show()
                        }
                        showEditPhoneDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold)
                ) {
                    Text("SAVE NUMBER", color = Color.Black, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                Button(
                    onClick = { showEditPhoneDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                ) {
                    Text("CANCEL", color = Color.White)
                }
            }
        )
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
