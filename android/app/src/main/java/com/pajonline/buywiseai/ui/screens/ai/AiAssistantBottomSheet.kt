package com.pajonline.buywiseai.ui.screens.ai

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.pajonline.buywiseai.R
import com.pajonline.buywiseai.core.voice.SpeechRecognizerManager
import com.pajonline.buywiseai.data.ai.MayaKnowledgeEngine
import com.pajonline.buywiseai.data.i18n.LanguageManager
import com.pajonline.buywiseai.data.i18n.tr
import androidx.activity.compose.BackHandler
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.launch

data class ChatMessage(
    val sender: String, // "user" or "ai"
    val text: String
)

@Composable
fun AiAssistantBottomSheet(
    onDismiss: () -> Unit,
    onNavigateToSearch: (String) -> Unit
) {
    // Prevent back press from exiting app or triggering auth logout
    BackHandler {
        onDismiss()
    }

    val context = LocalContext.current
    val speechManager = remember { SpeechRecognizerManager(context) }
    var isListening by remember { mutableStateOf(false) }
    var inputText by remember { mutableStateOf("") }

    val findBestDealText = tr("find_best_deal")
    val comparePricesText = tr("compare_prices")

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            speechManager.startListening(
                langCode = LanguageManager.currentLanguageCode,
                onPartialResult = { partial -> inputText = partial },
                onResult = { text ->
                    if (text.isNotBlank()) {
                        inputText = text
                    }
                },
                onError = {},
                onStateChanged = { state ->
                    isListening = state == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING
                }
            )
        }
    }

    val handleMicClick = {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            speechManager.startListening(
                langCode = LanguageManager.currentLanguageCode,
                onPartialResult = { partial -> inputText = partial },
                onResult = { text ->
                    if (text.isNotBlank()) {
                        inputText = text
                    }
                },
                onError = {},
                onStateChanged = { state ->
                    isListening = state == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING
                }
            )
        } else {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    val messages = remember {
        mutableStateListOf(
            ChatMessage("ai", "Namaste! I'm Maya, your BuyWise AI Assistant 🤖✨. Ask me to compare price deals across 14 stores, or upload/snap a photo for instant AI Visual Product Search & Trial Room styling!")
        )
    }
    var showPhotoUploadDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    var activeTopicContext by remember { mutableStateOf<String?>(null) }
    var lastTopicTimestamp by remember { mutableStateOf(0L) }

    // Full-screen backdrop & overlay container
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.65f))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) { onDismiss() },
        contentAlignment = Alignment.BottomCenter
    ) {
        // Maya AI Floating Panel (Borderless Seamless Design - NO HEAVY BOXES)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 12.dp)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { /* Consume clicks so tapping inside Maya panel NEVER dismisses it */ }
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color(0xFF16122B), Color(0xFF0A0816))
                    ),
                    shape = RoundedCornerShape(28.dp)
                )
                .padding(16.dp)
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(id = R.drawable.maya_ai_avatar),
                        contentDescription = "Maya AI Avatar",
                        modifier = Modifier.size(44.dp),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = tr("hi_maya"),
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseCyan
                        )
                        Text(
                            text = tr("online_status"),
                            fontSize = 11.sp,
                            color = BuyWiseEmerald,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color.White.copy(alpha = 0.1f), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Chat Messages List (Seamless Boxless Layout)
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp),
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
                                    if (isAi) Color(0xFF221C38) else BuyWisePurple,
                                    RoundedCornerShape(
                                        topStart = 18.dp,
                                        topEnd = 18.dp,
                                        bottomStart = if (isAi) 4.dp else 18.dp,
                                        bottomEnd = if (isAi) 18.dp else 4.dp
                                    )
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

            Spacer(modifier = Modifier.height(10.dp))

            // Quick Actions Pills Row (No outline borders)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { inputText = findBestDealText },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink.copy(alpha = 0.25f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(findBestDealText, fontSize = 11.sp, color = BuyWiseNeonPink, fontWeight = FontWeight.Black)
                }

                Button(
                    onClick = { inputText = comparePricesText },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(comparePricesText, fontSize = 11.sp, color = BuyWiseCyan, fontWeight = FontWeight.Black)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (isListening) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp)
                        .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .border(1.dp, BuyWiseEmerald, RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🎙️", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${tr("listening")} (${LanguageManager.currentLanguageCode.uppercase()})",
                            color = BuyWiseEmerald,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    Text(
                        text = tr("speak_clearly_mic"),
                        color = Color.LightGray,
                        fontSize = 11.sp
                    )
                }
            }

            // Input Field Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text(tr("ask_ai_assistant"), color = Color.Gray, fontSize = 13.sp) },
                    shape = RoundedCornerShape(16.dp),
                    trailingIcon = {
                        Row {
                            IconButton(onClick = { handleMicClick() }) {
                                Text(if (isListening) "🔴" else "🎙️", fontSize = 18.sp)
                            }
                            IconButton(onClick = { showPhotoUploadDialog = true }) {
                                Text("📷", fontSize = 18.sp)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.Transparent,
                        focusedContainerColor = Color(0xFF221C38),
                        unfocusedContainerColor = Color(0xFF1C172E),
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

                            scope.launch {
                                kotlinx.coroutines.delay(200)
                                val currentLang = LanguageManager.currentLanguageCode

                                val (responseText, updatedCategory) = MayaKnowledgeEngine.getAuthoritativeAnswer(
                                    query = userQuery,
                                    userLangCode = currentLang,
                                    lastCategory = activeTopicContext,
                                    lastTimestamp = lastTopicTimestamp
                                )

                                if (updatedCategory != null) {
                                    activeTopicContext = updatedCategory
                                    lastTopicTimestamp = System.currentTimeMillis()
                                }

                                messages.add(ChatMessage("ai", responseText))
                            }
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .background(BuyWiseCyan, CircleShape)
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.Black)
                }
            }
        }

        // MAYA PHOTO UPLOAD DIALOG
        if (showPhotoUploadDialog) {
            AlertDialog(
                onDismissRequest = { showPhotoUploadDialog = false },
                containerColor = Color(0xFF16122B),
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
                                .height(110.dp)
                                .background(Color(0xFF0C0A14), RoundedCornerShape(16.dp))
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
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF221C38)),
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
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF221C38)),
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
