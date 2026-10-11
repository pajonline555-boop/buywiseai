package com.pajonline.buywiseai.ui.screens.alerts

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
import androidx.compose.material.icons.filled.Notifications
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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
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

@Composable
fun AlertsScreen() {
    var showAddDialog by remember { mutableStateOf(false) }
    var newAlertQuery by remember { mutableStateOf("") }
    var newTargetPrice by remember { mutableStateOf("") }

    var pushEnabled by remember { mutableStateOf(true) }
    var whatsappEnabled by remember { mutableStateOf(true) }

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
                    title = "Kanjivaram Silk Saree (Pure Gold Zari)",
                    currentPrice = "₹2,999",
                    targetPrice = "₹2,499",
                    store = "Myntra / Ajio",
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
                        text = "Price Drop Alerts",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Real-Time FCM Push Notifications Active",
                        fontSize = 11.sp,
                        color = BuyWiseEmerald,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = { showAddDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.Black)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("+ New Alert", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Global Notification Status Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                shape = RoundedCornerShape(18.dp),
                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.4f))
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
                            Text("FCM Live Price Monitor", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Text("${alertList.size} Active Trackers", fontSize = 11.sp, color = BuyWiseCyan, fontWeight = FontWeight.Black)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Push Notifications (FCM)", fontSize = 12.sp, color = Color.LightGray)
                        Switch(
                            checked = pushEnabled,
                            onCheckedChange = { pushEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.Black, checkedTrackColor = BuyWiseCyan)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Instant WhatsApp Alert Sync", fontSize = 12.sp, color = Color.LightGray)
                        Switch(
                            checked = whatsappEnabled,
                            onCheckedChange = { whatsappEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.Black, checkedTrackColor = BuyWiseEmerald)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "YOUR ACTIVE PRICE TRACKERS",
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = Color.Gray,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

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
