package com.pajonline.buywiseai.ui.screens.ai

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.pajonline.buywiseai.R
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.launch

data class ChatMessage(
    val sender: String, // "user" or "ai"
    val text: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiAssistantBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onNavigateToSearch: (String) -> Unit
) {
    val messages = remember {
        mutableStateListOf(
            ChatMessage("ai", "Namaste! I'm Maya, your BuyWise AI Assistant 🤖✨. Ask me to compare price deals across 14 stores, or upload/snap a photo for instant AI Visual Product Search & Trial Room styling!")
        )
    }
    var inputText by remember { mutableStateOf("") }
    var showPhotoUploadDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color(0xFF120E24),
        scrimColor = Color.Black.copy(alpha = 0.75f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header Bar with Maya AI Persona
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(id = R.drawable.maya_ai_avatar),
                        contentDescription = "Maya AI Avatar",
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .border(2.dp, BuyWiseEmerald, CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Maya — BuyWise AI Assistant",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Online • Multi-Store & AI Vision Active 👁️",
                            fontSize = 11.sp,
                            color = BuyWiseEmerald,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Chat Messages List
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(Color(0xFF080612), RoundedCornerShape(16.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages) { msg ->
                    val isAi = msg.sender == "ai"
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isAi) Arrangement.Start else Arrangement.End
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.88f)
                                .background(
                                    if (isAi) Color(0xFF1E1B2E) else BuyWisePurple.copy(alpha = 0.85f),
                                    RoundedCornerShape(14.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isAi) BuyWiseCyan.copy(alpha = 0.35f) else BuyWiseNeonPink.copy(alpha = 0.45f),
                                    RoundedCornerShape(14.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Text(
                                text = msg.text,
                                fontSize = 13.sp,
                                color = Color.White,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Quick Actions & Photo Upload Launcher Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { showPhotoUploadDialog = true },
                    modifier = Modifier.weight(1.2f),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink.copy(alpha = 0.2f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseNeonPink),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📷 Upload Photo to Maya", fontSize = 10.sp, color = BuyWiseNeonPink, fontWeight = FontWeight.Black)
                }

                Button(
                    onClick = {
                        inputText = "Find best price for iPhone 17"
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📱 iPhone 17 Deal", fontSize = 10.sp, color = BuyWiseCyan)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Input Field Bar with Photo Camera Icon
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Ask Maya about prices, fitting, or deals...", color = Color.Gray, fontSize = 13.sp) },
                    shape = RoundedCornerShape(16.dp),
                    trailingIcon = {
                        IconButton(onClick = { showPhotoUploadDialog = true }) {
                            Text("📷", fontSize = 18.sp)
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val userQuery = inputText
                            messages.add(ChatMessage("user", userQuery))
                            inputText = ""

                            // Simulate Maya AI Response
                            scope.launch {
                                kotlinx.coroutines.delay(600)
                                if (userQuery.lowercase().contains("saree") || userQuery.lowercase().contains("dress")) {
                                    messages.add(
                                        ChatMessage(
                                            "ai",
                                            "Maya found 8 matches for '$userQuery'! ✨ Lowest price on Myntra at ₹4,999 with 25% cashback. You can also tap 'Try-On Room' to see how it fits you!"
                                        )
                                    )
                                } else if (userQuery.lowercase().contains("phone") || userQuery.lowercase().contains("iphone") || userQuery.lowercase().contains("s24")) {
                                    messages.add(
                                        ChatMessage(
                                            "ai",
                                            "Maya's Live Deal Tracker: '$userQuery' is lowest on Amazon India at ₹82,900 with extra ₹1,500 HDFC bank card discount!"
                                        )
                                    )
                                } else {
                                    messages.add(
                                        ChatMessage(
                                            "ai",
                                            "Maya scanned 14 stores for '$userQuery'. Tap below to view product comparisons, coupon codes, and 3D Try-On options!"
                                        )
                                    )
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .size(50.dp)
                        .background(BuyWiseCyan, CircleShape)
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.Black)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        // MAYA PHOTO UPLOAD VISUAL ANALYZER DIALOG
        if (showPhotoUploadDialog) {
            AlertDialog(
                onDismissRequest = { showPhotoUploadDialog = false },
                containerColor = Color(0xFF141026),
                title = {
                    Column {
                        Text(
                            text = "📷 Maya AI Vision Photo Upload",
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 17.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Upload or snap a product/clothing photo for instant visual search & fitting advice",
                            color = BuyWiseCyan,
                            fontSize = 12.sp
                        )
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .background(Color(0xFF0C0A14), RoundedCornerShape(16.dp))
                                .border(1.dp, BuyWiseNeonPink.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                                .clickable {
                                    showPhotoUploadDialog = false
                                    messages.add(ChatMessage("user", "📷 [Uploaded Outfit Photo to Maya]"))
                                    scope.launch {
                                        kotlinx.coroutines.delay(800)
                                        messages.add(
                                            ChatMessage(
                                                "ai",
                                                "Maya AI Vision Analysis Complete! 👁️✨\nDetected: Premium Silk Saree with Zari Work.\n• Lowest Price: ₹5,499 on Myntra (Original ₹8,999)\n• AI Fit Match: 98% Compatibility\n• Action: Tap 'Try-On Room' to preview on your photo!"
                                            )
                                        )
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("📸 Tap to Select Photo / Take Picture", color = BuyWiseNeonPink, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Supports JPG, PNG, WEBP • Max 10MB", color = Color.Gray, fontSize = 11.sp)
                            }
                        }

                        Text("Or analyze sample items:", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    showPhotoUploadDialog = false
                                    messages.add(ChatMessage("user", "📷 [Uploaded Sample: Kanjivaram Silk Saree]"))
                                    scope.launch {
                                        kotlinx.coroutines.delay(800)
                                        messages.add(
                                            ChatMessage(
                                                "ai",
                                                "Maya AI Vision matched item to 'Royal Kanjivaram Silk Saree'! Lowest price ₹4,999 on Myntra with ₹500 instant discount."
                                            )
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("👗 Silk Saree", fontSize = 11.sp, color = Color.White)
                            }

                            Button(
                                onClick = {
                                    showPhotoUploadDialog = false
                                    messages.add(ChatMessage("user", "📷 [Uploaded Sample: Smartphone Photo]"))
                                    scope.launch {
                                        kotlinx.coroutines.delay(800)
                                        messages.add(
                                            ChatMessage(
                                                "ai",
                                                "Maya AI Vision identified 'Samsung Galaxy S24 Ultra'! Lowest live deal: ₹1,19,999 on Amazon India."
                                            )
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("📱 Tech Device", fontSize = 11.sp, color = Color.White)
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { showPhotoUploadDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = BuyWisePurple)
                    ) {
                        Text("CANCEL", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    }
}

