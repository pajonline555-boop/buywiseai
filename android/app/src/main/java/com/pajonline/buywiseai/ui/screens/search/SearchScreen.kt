package com.pajonline.buywiseai.ui.screens.search

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
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.AlertDialog
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import com.pajonline.buywiseai.core.voice.SpeechRecognizerManager
import com.pajonline.buywiseai.data.i18n.LanguageManager
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.domain.model.StoreOffer
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareUiState
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareViewModel

@Composable
fun SearchScreen(
    viewModel: SmartCompareViewModel = remember { SmartCompareViewModel() },
    onOfferSelect: (StoreOffer) -> Unit = {}
) {
    val context = LocalContext.current
    val currentViewModelQuery = viewModel.currentQuery
    var query by remember { mutableStateOf(if (currentViewModelQuery.isNotBlank()) currentViewModelQuery else "foil paper") }

    androidx.compose.runtime.LaunchedEffect(viewModel.currentQuery) {
        if (viewModel.currentQuery.isNotBlank()) {
            query = viewModel.currentQuery
        }
    }
    val uiState by viewModel.uiState.collectAsState()

    var voiceState by remember { mutableStateOf(com.pajonline.buywiseai.core.voice.VoiceSearchState.IDLE) }
    var voiceError by remember { mutableStateOf<String?>(null) }
    var livePartialText by remember { mutableStateOf("") }
    var showVoiceDialog by remember { mutableStateOf(false) }

    val micDeniedMsg = tr("mic_perm_denied")
    val speechManager = remember { SpeechRecognizerManager(context) }

    DisposableEffect(Unit) {
        onDispose {
            speechManager.destroy()
        }
    }

    val triggerSpeechRecognition = {
        showVoiceDialog = true
        voiceError = null
        livePartialText = ""

        speechManager.startListening(
            langCode = LanguageManager.currentLanguageCode,
            onPartialResult = { partial ->
                livePartialText = partial
                query = partial
            },
            onResult = { text ->
                query = text
                livePartialText = text
                viewModel.performSearch(text)
                showVoiceDialog = false
            },
            onError = { err ->
                voiceError = err
            },
            onStateChanged = { state ->
                voiceState = state
            }
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            triggerSpeechRecognition()
        } else {
            voiceError = micDeniedMsg
            voiceState = com.pajonline.buywiseai.core.voice.VoiceSearchState.ERROR
            showVoiceDialog = true
        }
    }

    val handleMicClick = {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            triggerSpeechRecognition()
        } else {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
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
            Text(
                text = "SmartCompare Matrix",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Real-time price & trust aggregation across 14 stores",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Search Bar with Native Voice (🎙️) Search Button
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text(tr("search_placeholder"), color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = BuyWiseCyan) },
                    trailingIcon = {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(
                                    if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING) BuyWiseNeonPink.copy(alpha = 0.35f)
                                    else BuyWiseCyan.copy(alpha = 0.25f),
                                    CircleShape
                                )
                                .border(
                                    1.5.dp,
                                    if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING) BuyWiseNeonPink else BuyWiseCyan,
                                    CircleShape
                                )
                                .clickable { handleMicClick() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING) "🔴" else "🎙️",
                                fontSize = 16.sp
                            )
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = { viewModel.performSearch(query) },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(text = tr("compare_btn"), color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Non-Intrusive AdMob Banner Ad View
            com.pajonline.buywiseai.core.ads.BannerAdView()

            Spacer(modifier = Modifier.height(10.dp))

            // Voice Search Real-Time Listening & Status Dialog
            if (showVoiceDialog) {
                AlertDialog(
                    onDismissRequest = {
                        speechManager.stopListening()
                        showVoiceDialog = false
                    },
                    containerColor = Color(0xFF141026),
                    title = {
                        Text(
                            text = when (voiceState) {
                                com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING -> "🎙️ ${tr("Listening in")} ${LanguageManager.currentLanguageCode.uppercase()}..."
                                com.pajonline.buywiseai.core.voice.VoiceSearchState.PROCESSING -> "🔎 ${tr("searching")}"
                                com.pajonline.buywiseai.core.voice.VoiceSearchState.SUCCESS -> "✅ ${tr("compare_btn")}"
                                else -> "⚠️ Voice Notice"
                            },
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    },
                    text = {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.LISTENING) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(
                                        modifier = Modifier
                                            .size(72.dp)
                                            .background(BuyWiseEmerald.copy(alpha = 0.2f), CircleShape)
                                            .border(2.5.dp, BuyWiseEmerald, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("🎙️", fontSize = 32.sp)
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = tr("speak_listening"),
                                        color = BuyWiseEmerald,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 16.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(14.dp))
                                if (livePartialText.isNotBlank()) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFF080612), RoundedCornerShape(12.dp))
                                            .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                            .padding(12.dp)
                                    ) {
                                        Text(
                                            text = "\"$livePartialText\"",
                                            color = BuyWiseEmerald,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                    }
                                } else {
                                    Text(
                                        text = tr("speak_clearly_mic"),
                                        color = Color.LightGray,
                                        fontSize = 12.sp
                                    )
                                }
                            } else if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.PROCESSING) {
                                CircularProgressIndicator(color = BuyWiseCyan, modifier = Modifier.size(40.dp))
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "${tr("searching")} (14 stores)",
                                    color = Color.LightGray,
                                    fontSize = 13.sp
                                )
                            } else if (voiceError != null) {
                                Text(
                                    text = voiceError ?: tr("no_speech_detected"),
                                    color = Color(0xFFFF6B6B),
                                    fontSize = 13.sp
                                )
                            }
                        }
                    },
                    confirmButton = {
                        if (voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.ERROR || voiceState == com.pajonline.buywiseai.core.voice.VoiceSearchState.NO_SPEECH) {
                            Button(
                                onClick = { triggerSpeechRecognition() },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                            ) {
                                Text(tr("try_again"), color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    },
                    dismissButton = {
                        Button(
                            onClick = {
                                speechManager.stopListening()
                                showVoiceDialog = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                        ) {
                            Text(tr("cancel"), color = Color.White)
                        }
                    }
                )
            }

            when (val state = uiState) {
                is SmartCompareUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = BuyWiseCyan)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(text = "Aggregating 14 stores...", color = Color.LightGray, fontSize = 13.sp)
                        }
                    }
                }
                is SmartCompareUiState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF33141E))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "Search Error", color = Color(0xFFFF6B6B), fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = state.message, color = Color.LightGray, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { viewModel.performSearch(query) },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                            ) {
                                Text("RETRY SEARCH", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                is SmartCompareUiState.Success -> {
                    val response = state.response
                    val summary = response.summary

                    // Search Summary Metrics Bar
                    if (summary != null) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(tr("lowest_price"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("₹${summary.lowestPrice.toInt()}", fontSize = 15.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                                }
                                Column {
                                    Text(tr("max_savings"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("₹${summary.maximumSavings.toInt()}", fontSize = 15.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                                }
                                Column {
                                    Text(tr("stores_checked"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("${summary.totalStoresChecked} Stores", fontSize = 15.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    if (response.stores.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No store offers found for this query.", color = Color.Gray)
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(response.stores) { offer ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.selectOffer(offer)
                                            onOfferSelect(offer)
                                        },
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF191629)),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = offer.store,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = BuyWiseCyan
                                            )
                                            Text(
                                                text = "Trust: ${offer.trustScore ?: 95}/100",
                                                fontSize = 11.sp,
                                                color = BuyWiseEmerald
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = offer.title,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color.White,
                                            maxLines = 2
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(verticalAlignment = Alignment.Bottom) {
                                            Text(
                                                text = "₹${offer.price.toInt()}",
                                                fontSize = 18.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = BuyWiseEmerald
                                            )
                                            if (offer.mrp != null && offer.mrp > offer.price) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = "₹${offer.mrp.toInt()}",
                                                    fontSize = 13.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "Search for any product to view real price matrix", color = Color.Gray, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}
