package com.pajonline.buywiseai.ui.screens.home

import android.content.Context
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import coil.compose.AsyncImage
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseGold

import com.pajonline.buywiseai.data.i18n.LanguageManager
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.data.repository.CompetitionRepository
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.components.CoreExperienceCards
import com.pajonline.buywiseai.ui.components.GenGStoreShowcase
import com.pajonline.buywiseai.ui.components.ShoppingJourneyBar
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import com.pajonline.buywiseai.core.voice.SpeechRecognizerManager

@Composable
fun HomeScreen(
    onNavigateToSearch: (String) -> Unit,
    onNavigateToVto: () -> Unit = {},
    onNavigateToCompetition: () -> Unit = {},
    onNavigateToAlerts: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToAdmin: () -> Unit = {},
    onOpenAiAssistant: () -> Unit = {}
) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("buywise_profile_prefs", Context.MODE_PRIVATE) }
    val profilePhotoUri = sharedPrefs.getString("profile_photo_uri", null)
    val profileAvatarEmoji = sharedPrefs.getString("profile_avatar_emoji", "🛍️") ?: "🛍️"

    var searchQuery by remember { mutableStateOf("") }
    var showLangMenu by remember { mutableStateOf(false) }

    var voiceState by remember { mutableStateOf(com.pajonline.buywiseai.core.voice.VoiceSearchState.IDLE) }
    var voiceError by remember { mutableStateOf<String?>(null) }
    var livePartialText by remember { mutableStateOf("") }
    var showVoiceDialog by remember { mutableStateOf(false) }

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
                searchQuery = partial
            },
            onResult = { text ->
                searchQuery = text
                livePartialText = text
                showVoiceDialog = false
                onNavigateToSearch(text)
            },
            onError = { err ->
                voiceError = err
            },
            onStateChanged = { state ->
                voiceState = state
            }
        )
    }

    val micDeniedMsg = tr("mic_perm_denied")
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

    val activeComp = CompetitionRepository.getActiveCompetition()
    val pastWinnerPair = CompetitionRepository.getPastWinnerCompetition()
    var showRulesDialog by remember { mutableStateOf(false) }

    val retailers = listOf("Amazon India", "Flipkart", "Meesho", "Myntra", "AJIO", "Nykaa", "Tata CLiQ", "eBay")
    val categories = listOf(
        "Fashion & Clothing" to BuyWiseNeonPink,
        "Mobiles & Tech" to BuyWiseCyan,
        "Audio & Gadgets" to BuyWiseGold,
        "Beauty & Care" to BuyWiseEmerald
    )

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Spacer(modifier = Modifier.height(8.dp))

                // BRAND TOP HEADER BAR WITH LANGUAGE SELECTOR
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BuyWiseLogo(
                        logoHeight = 34.dp,
                        fontSize = 20
                    )

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Language Switcher Pill Dropdown
                        Box {
                            val activeLang = LanguageManager.supportedLanguages.firstOrNull { it.code == LanguageManager.currentLanguageCode }
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF1E1B2E), RoundedCornerShape(16.dp))
                                    .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                                    .clickable { showLangMenu = true }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "${activeLang?.flag ?: "🌐"} ${activeLang?.name ?: "EN"} ▾",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = BuyWiseCyan
                                )
                            }

                            DropdownMenu(
                                expanded = showLangMenu,
                                onDismissRequest = { showLangMenu = false },
                                modifier = Modifier.background(Color(0xFF120E24))
                            ) {
                                LanguageManager.supportedLanguages.forEach { lang ->
                                    DropdownMenuItem(
                                        text = { Text("${lang.flag} ${lang.name}", color = Color.White, fontSize = 13.sp) },
                                        onClick = {
                                            LanguageManager.setLanguage(context, lang.code)
                                            showLangMenu = false
                                        }
                                    )
                                }
                            }
                        }

                        val bellTransition = rememberInfiniteTransition(label = "bell_ringing")
                        val bellRotation by bellTransition.animateFloat(
                            initialValue = -14f,
                            targetValue = 14f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(durationMillis = 180, easing = LinearEasing),
                                repeatMode = RepeatMode.Reverse
                            ),
                            label = "bell_rotation"
                        )

                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(Color(0xFF1E1B2E), CircleShape)
                                .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), CircleShape)
                                .clickable { onNavigateToAlerts() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = "Price Alerts",
                                tint = BuyWiseGold,
                                modifier = Modifier
                                    .size(20.dp)
                                    .graphicsLayer(rotationZ = bellRotation)
                            )

                            // Active Alert Badge Dot
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(14.dp)
                                    .background(Color(0xFFFF0055), CircleShape)
                                    .border(1.dp, Color.White, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("3", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(Color(0xFF1E1B2E), CircleShape)
                                .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), CircleShape)
                                .clickable { onNavigateToProfile() },
                            contentAlignment = Alignment.Center
                        ) {
                            val currentPhotoUri = profilePhotoUri
                            val photoFile = remember(currentPhotoUri) {
                                if (!currentPhotoUri.isNullOrEmpty()) java.io.File(currentPhotoUri) else null
                            }
                            val imageModel: Any? = when {
                                photoFile?.exists() == true -> photoFile
                                !currentPhotoUri.isNullOrEmpty() && (currentPhotoUri.startsWith("http://") || currentPhotoUri.startsWith("https://") || currentPhotoUri.startsWith("content://")) -> currentPhotoUri
                                else -> null
                            }

                            if (imageModel != null) {
                                AsyncImage(
                                    model = imageModel,
                                    contentDescription = "Profile",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else {
                                Text(profileAvatarEmoji, fontSize = 18.sp)
                            }
                        }
                    }
                }

                val authRepo = remember { com.pajonline.buywiseai.data.repository.AuthRepository.getInstance() }
                val authState by authRepo.authState.collectAsState()
                val savedEmail = sharedPrefs.getString("saved_user_email", "") ?: ""
                val isAdmin = (authState as? com.pajonline.buywiseai.data.repository.AuthState.Authenticated)?.let {
                    it.role == "ADMIN" || authRepo.isEmailAdmin(it.userEmail)
                } ?: authRepo.isEmailAdmin(savedEmail)

                if (isAdmin) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToAdmin() },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1438)),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("👑", fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = "ADMIN MODE ACTIVE",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        color = BuyWiseGold
                                    )
                                    Text(
                                        text = "Tap to open Admin Control Center",
                                        fontSize = 10.sp,
                                        color = Color.LightGray
                                    )
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .background(BuyWiseGold, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("MANAGE ➔", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.Black)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                // TOP SECTION 1: SmartCompare Live Search Engine
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.35f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = tr("smart_compare_engine"),
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = tr("app_tagline"),
                            fontSize = 11.5.sp,
                            color = BuyWiseCyan.copy(alpha = 0.9f),
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.3.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text(tr("search_placeholder"), color = Color.Gray) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = BuyWiseCyan) },
                            trailingIcon = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    IconButton(
                                        onClick = { handleMicClick() }
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(32.dp)
                                                .background(BuyWiseCyan.copy(alpha = 0.25f), CircleShape)
                                                .border(1.dp, BuyWiseCyan, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("🎙️", fontSize = 15.sp)
                                        }
                                    }
                                    IconButton(
                                        onClick = { onNavigateToVto() }
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(32.dp)
                                                .background(BuyWiseNeonPink.copy(alpha = 0.25f), CircleShape)
                                                .border(1.dp, BuyWiseNeonPink, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("📷", fontSize = 15.sp)
                                        }
                                    }
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

                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val quickTags = listOf(
                                "👗 Saree", "📱 iPhone 17", "🎧 AirPods Pro", "👟 Sneakers",
                                "💄 Lipsticks", "💻 Laptops", "⌚ Smartwatch", "🧥 Jackets"
                            )
                            quickTags.forEach { tagWithEmoji ->
                                val rawSearch = tagWithEmoji.substringAfter(" ").trim()
                                Box(
                                    modifier = Modifier
                                        .background(Color(0xFF1E1B38), RoundedCornerShape(20.dp))
                                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                                        .clickable {
                                            searchQuery = rawSearch
                                            onNavigateToSearch(rawSearch)
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = tagWithEmoji,
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        // Voice Search Dialog
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
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { if (searchQuery.isNotBlank()) onNavigateToSearch(searchQuery) else onNavigateToSearch("iPhone 17") },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = tr("compare_btn"), color = Color.Black, fontWeight = FontWeight.Black)
                            }

                            Button(
                                onClick = onNavigateToVto,
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = tr("ai_trial_room"), color = Color.White, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // TOP SECTION 1B: WEEKLY BUYWISE CHALLENGE & WINNER SPOTLIGHT CARD
                if (activeComp != null) {
                    val cleanShortTitle = remember(activeComp.title) {
                        activeComp.title.substringBefore("|")
                            .replace("Weekly BuyWise Fashion Challenge: ", "")
                            .replace("Weekly BuyWise Fashion Challenge:", "")
                            .trim()
                    }
                    val productImg = remember(activeComp.featuredProductImage) {
                        if (activeComp.featuredProductImage.isNotBlank() && !activeComp.featuredProductImage.contains("unsplash")) {
                            activeComp.featuredProductImage
                        } else {
                            "https://buywiseai.pajonline.co.in/kamarbandh.png"
                        }
                    }

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToCompetition() },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A122E)),
                        shape = RoundedCornerShape(20.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .background(BuyWiseGold, RoundedCornerShape(10.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(tr("weekly_challenge_banner"), fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.Black)
                                }
                                Text("₹${activeComp.featuredProductPrice} • ${tr("free_entry")}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // PRODUCT IMAGE + SHORT TITLE (Features description hidden as requested)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(76.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(Color(0xFF261D3D))
                                        .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), RoundedCornerShape(14.dp))
                                ) {
                                    AsyncImage(
                                        model = productImg,
                                        contentDescription = cleanShortTitle,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = cleanShortTitle,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White,
                                        maxLines = 2
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "👗 Verified ${activeComp.retailer} • ₹${activeComp.featuredProductPrice}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BuyWiseCyan
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // BUTTON LINE: TRY PRODUCT NOW, ENTER NOW, RULE TO PARTICIPATE
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Button(
                                    onClick = onNavigateToVto,
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                ) {
                                    Text("👗 Try Product Now", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 10.sp)
                                }

                                Button(
                                    onClick = onNavigateToCompetition,
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                ) {
                                    Text("🏆 Enter Now", color = Color.White, fontWeight = FontWeight.Black, fontSize = 10.sp)
                                }

                                Button(
                                    onClick = { showRulesDialog = true },
                                    modifier = Modifier.weight(1.1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D2545)),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                ) {
                                    Text("📜 Rule to Participate", color = Color(0xFFFFD700), fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // CATEGORIES SECTION (After Hero & Challenge Banner, Before Gen G Showcase)
                Text(
                    text = tr("shop_by_category"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val categoriesLocalized = listOf(
                        tr("cat_fashion") to BuyWiseNeonPink,
                        tr("cat_tech") to BuyWiseCyan,
                        tr("cat_audio") to BuyWiseGold,
                        tr("cat_beauty") to BuyWiseEmerald
                    )
                    categoriesLocalized.forEach { (catName, catColor) ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(catColor.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                                .border(1.dp, catColor.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                .clickable { onNavigateToSearch(catName) }
                                .padding(vertical = 12.dp, horizontal = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = catName,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = catColor
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 2: Exclusive Gen G Store Showcase
                GenGStoreShowcase(
                    onViewAllClick = { onNavigateToSearch("Gen-G Store") },
                    onTryOnClick = { prod -> onNavigateToVto() },
                    onBuyNowClick = { prod ->
                        val rawUrl = prod.productUrl.ifEmpty { "https://www.amazon.in/s?k=${Uri.encode(prod.title)}" }
                        val affiliateUrl = if (rawUrl.contains("tag=")) rawUrl
                            else if (rawUrl.contains("?")) "$rawUrl&tag=pajonline-21&ascsubtag=bw_gen_g_store"
                            else "$rawUrl?tag=pajonline-21&ascsubtag=bw_gen_g_store"
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(affiliateUrl)).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            onNavigateToSearch(prod.title)
                        }
                    },
                    onShareClick = { prod ->
                        val shareUrl = "https://buywiseai.pajonline.co.in/product/${prod.slug.ifEmpty { prod.id }}"
                        val sendIntent = Intent(Intent.ACTION_SEND).apply {
                            putExtra(Intent.EXTRA_TEXT, "Check out ${prod.title} on BuyWise AI! Compare prices & try on: $shareUrl")
                            type = "text/plain"
                        }
                        context.startActivity(Intent.createChooser(sendIntent, "Share Product via"))
                    }
                )

                Spacer(modifier = Modifier.height(28.dp))

                // SECTION 3: See Compare Try On Save Buy
                ShoppingJourneyBar(onStepClick = { stepId ->
                    when (stepId) {
                        "see" -> onNavigateToSearch("Saree")
                        "compare" -> onNavigateToSearch("iPhone")
                        "tryon" -> onNavigateToVto()
                        "save" -> onNavigateToSearch("Coupons")
                        "buy" -> onNavigateToSearch("Bestsellers")
                    }
                })

                Spacer(modifier = Modifier.height(16.dp))

                CoreExperienceCards(
                    onCompareClick = { onNavigateToSearch("iPhone 17") },
                    onTryOnClick = onNavigateToVto,
                    onCouponsClick = { onNavigateToSearch("Coupons") }
                )

                Spacer(modifier = Modifier.height(28.dp))

                // SECTION 6: Trending Comparisons
                Text(
                    text = tr("trending_comparisons"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(10.dp))
                TrendingComparisonCard(
                    title = "iPhone 17 (256 GB)",
                    amazonPrice = "₹82,900",
                    flipkartPrice = "₹83,999",
                    recommendation = "Amazon (₹82,900 Best Price)",
                    score = "9.9",
                    tag = "🔥 LATEST TRENDING",
                    onClick = { onNavigateToSearch("iPhone 17") }
                )

                Spacer(modifier = Modifier.height(12.dp))

                TrendingComparisonCard(
                    title = "Samsung Galaxy S24 Ultra",
                    amazonPrice = "₹1,19,999",
                    flipkartPrice = "₹1,21,999",
                    recommendation = "Amazon (₹1,19,999 Deal)",
                    score = "9.7",
                    tag = "ANDROID FLAGSHIP",
                    onClick = { onNavigateToSearch("Samsung S24 Ultra") }
                )

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 7: Supported Retailers Network
                Text(
                    text = tr("supported_retailers"),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(retailers) { store ->
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF1E1B2E), RoundedCornerShape(12.dp))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(text = store, fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(96.dp))
            }
        }
    }

    if (showRulesDialog && activeComp != null) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showRulesDialog = false },
            containerColor = Color(0xFF141026),
            shape = RoundedCornerShape(20.dp),
            title = {
                Text("📜 Challenge Rules & Participation", color = BuyWiseGold, fontWeight = FontWeight.Black, fontSize = 16.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("1. Eligibility: Open to all verified BuyWise registered shoppers (18+ in India).", color = Color.White, fontSize = 12.sp)
                    Text("2. How to Participate: Try on the featured outfit in the AI Trial Room and submit your entry look.", color = Color.LightGray, fontSize = 12.sp)
                    Text("3. Entry Limit: Exactly 1 look submission per user per weekly challenge.", color = Color.LightGray, fontSize = 12.sp)
                    Text("4. Fair Community Voting: Transparent voting with anti-fraud voter verification.", color = Color.LightGray, fontSize = 12.sp)
                    Text("5. Rewards: Top-voted winner receives ₹5,000 Voucher / Free Outfit + BuyWise Spotlight!", color = BuyWiseEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showRulesDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Understood", color = Color.Black, fontWeight = FontWeight.Black)
                }
            }
        )
    }
}

@Composable
private fun TrendingComparisonCard(
    title: String,
    amazonPrice: String,
    flipkartPrice: String,
    recommendation: String,
    score: String,
    tag: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWisePurple.copy(alpha = 0.35f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .background(
                            brush = Brush.horizontalGradient(listOf(BuyWisePurple, BuyWiseNeonPink)),
                            shape = RoundedCornerShape(10.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(text = "#$score AI SCORE", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White)
                }

                Text(text = tag, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseNeonPink)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(text = title, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Amazon", fontSize = 12.sp, color = Color.Gray)
                Text(text = amazonPrice, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Flipkart", fontSize = 12.sp, color = Color.Gray)
                Text(text = flipkartPrice, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0C0A14), RoundedCornerShape(10.dp))
                    .padding(10.dp)
            ) {
                Column {
                    Text(text = tr("our_recommendation"), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = BuyWiseCyan)
                    Text(text = recommendation, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
