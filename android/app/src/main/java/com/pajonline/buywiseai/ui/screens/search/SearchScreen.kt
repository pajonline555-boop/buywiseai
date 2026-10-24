package com.pajonline.buywiseai.ui.screens.search

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
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
import java.text.NumberFormat
import java.util.Locale
import kotlinx.coroutines.launch

@Composable
fun SearchScreen(
    viewModel: SmartCompareViewModel = remember { SmartCompareViewModel() },
    onBack: () -> Unit = {},
    onOfferSelect: (StoreOffer) -> Unit = {}
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    var isHeaderVisible by remember { mutableStateOf(true) }
    var selectedTierFilter by remember { mutableStateOf("ALL") }
    var selectedViewMode by remember { mutableStateOf("BEST_MATCHES") } // BEST_MATCHES | SAME_PRODUCT | ALL_STORES

    val currentViewModelQuery = viewModel.currentQuery
    var query by remember { mutableStateOf(currentViewModelQuery.ifBlank { "samsung tv" }) }

    val executeSearch = { searchStr: String ->
        isHeaderVisible = true
        selectedTierFilter = "ALL"
        selectedViewMode = "BEST_MATCHES"
        coroutineScope.launch {
            try {
                listState.scrollToItem(0)
            } catch (_: Exception) {}
        }

        viewModel.performSearch(searchStr)
    }

    LaunchedEffect(viewModel.currentQuery) {
        if (viewModel.currentQuery.isNotBlank()) {
            query = viewModel.currentQuery
        }
    }
    val uiState by viewModel.uiState.collectAsState()

    // NestedScrollConnection: Swiping finger UP (delta < 0) collapses header for full screen product viewing.
    // Swiping finger DOWN (delta > 0) smoothly restores header & search controls.
    val nestedScrollConnection = remember(uiState) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                if (uiState is SmartCompareUiState.Success) {
                    val delta = available.y
                    if (delta < -12f && isHeaderVisible) {
                        isHeaderVisible = false
                    } else if (delta > 12f && !isHeaderVisible) {
                        isHeaderVisible = true
                    }
                }
                return Offset.Zero
            }
        }
    }

    // Auto-restore header when reaching the top item
    LaunchedEffect(listState.firstVisibleItemIndex, listState.firstVisibleItemScrollOffset) {
        if (listState.firstVisibleItemIndex == 0 && listState.firstVisibleItemScrollOffset <= 4) {
            isHeaderVisible = true
        }
    }

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
                executeSearch(text)
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

    // Popular Quick Comparison Suggestions
    val trendingSearches = listOf(
        "👗 Girl Dresses" to "Girl Dresses",
        "📺 Samsung 43\" 4K TV" to "Samsung 43 inch 4K TV",
        "📱 iPhone 16" to "iPhone 16",
        "💻 MacBook Air M2" to "MacBook Air M2",
        "🎧 Sony XM5" to "Sony WH-1000XM5",
        "💄 Maybelline Lipstick" to "Maybelline Lipstick",
        "👟 Running Shoes" to "Running Shoes",
        "💍 Kamarbandh" to "Kamarbandh",
        "👗 Banarasi Saree" to "Banarasi Silk Saree",
        "🧺 LG 7kg Washing Machine" to "LG 7kg Front Load Washing Machine",
        "🧊 Samsung Refrigerator" to "Samsung 236L Refrigerator"
    )

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .nestedScroll(nestedScrollConnection)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp)
            ) {
                // Collapsible Header Section: Smoothly collapses up on scroll for full-screen products viewing
                AnimatedVisibility(
                    visible = isHeaderVisible,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp, bottom = 6.dp)
                    ) {
                        // Header Bar
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFF1E1B2E), CircleShape)
                                    .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), CircleShape)
                                    .clickable { onBack() },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("←", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }

                            Column {
                                Text(
                                    text = "SmartCompare Matrix",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Real-time price & trust aggregation across 14 stores",
                                    fontSize = 11.5.sp,
                                    color = Color.Gray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Search Bar with Native Voice Search Button
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
                                ),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { executeSearch(query) },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = tr("compare_btn"), color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Quick Comparison Suggestion Chips
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(trendingSearches) { (label, searchQ) ->
                                Box(
                                    modifier = Modifier
                                        .background(Color(0xFF1B172E), RoundedCornerShape(20.dp))
                                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                                        .clickable {
                                            query = searchQ
                                            executeSearch(searchQ)
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Non-Intrusive AdMob Banner Ad View
                        com.pajonline.buywiseai.core.ads.BannerAdView()
                    }
                }

                // Results Container: Expands to full screen when header collapses
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    when (val state = uiState) {
                        is SmartCompareUiState.Loading -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(color = BuyWiseCyan)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(text = "Aggregating 14 stores in real time...", color = Color.LightGray, fontSize = 13.sp)
                                }
                            }
                        }
                        is SmartCompareUiState.Error -> {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF33141E))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(text = "Search Error", color = Color(0xFFFF6B6B), fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(text = state.message, color = Color.LightGray, fontSize = 12.sp)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Button(
                                        onClick = { executeSearch(query) },
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
                            val lowestPriceOffers = remember(response.stores) { response.stores.filter { it.matchType == "LOWEST_PRICE" } }
                            val brandedOffers = remember(response.stores) { response.stores.filter { it.matchType == "BRANDED" } }
                            val isDualItemResult = lowestPriceOffers.isNotEmpty() && brandedOffers.isNotEmpty()

                            val displayedOffers = when (selectedTierFilter) {
                                "LOWEST_PRICE" -> lowestPriceOffers
                                "BRANDED" -> brandedOffers
                                else -> response.stores
                            }

                            if (response.stores.isEmpty()) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier.padding(24.dp)
                                    ) {
                                        Text("No store offers found for this query.", color = Color.Gray, fontSize = 14.sp)
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text("Explore Popular Categories:", color = BuyWiseCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = { 
                                                    query = "Girl Dresses"
                                                    executeSearch("Girl Dresses") 
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                                                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.5f))
                                            ) {
                                                Text("👗 Girl Dresses", color = Color.White, fontSize = 12.sp)
                                            }
                                            Button(
                                                onClick = { 
                                                    query = "Samsung 43 inch 4K TV"
                                                    executeSearch("Samsung 43 inch 4K TV") 
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                                                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.5f))
                                            ) {
                                                Text("📺 4K Smart TV", color = Color.White, fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            } else {
                                LazyColumn(
                                    state = listState,
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    // Top spacer when header is collapsed so floating pill has breathing room
                                    if (!isHeaderVisible) {
                                        item(key = "fullscreen_top_padding") {
                                            Spacer(modifier = Modifier.height(46.dp))
                                        }
                                    }

                                    // Summary Metrics Bar (inside LazyColumn to scroll naturally off screen)
                                    if (summary != null && summary.lowestPrice > 0) {
                                        item(key = "summary_metrics_card") {
                                            Card(
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
                                                shape = RoundedCornerShape(12.dp),
                                                border = BorderStroke(1.dp, Color(0xFF2C2548))
                                            ) {
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(14.dp),
                                                    horizontalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    Column {
                                                        Text(tr("lowest_price"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                                        Text(
                                                            text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(summary.lowestPrice.toInt())}",
                                                            fontSize = 16.sp,
                                                            color = BuyWiseEmerald,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }
                                                    Column {
                                                        Text(tr("max_savings"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                                        Text(
                                                            text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(summary.maximumSavings.toInt())}",
                                                            fontSize = 16.sp,
                                                            color = BuyWiseGold,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }
                                                    Column {
                                                        Text(tr("stores_checked"), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                                        Text(
                                                            text = "${summary.totalStoresChecked} Stores",
                                                            fontSize = 16.sp,
                                                            color = BuyWiseCyan,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // Deal Recommendation Banner (inside LazyColumn)
                                    if (!response.recommendation.isNullOrBlank()) {
                                        item(key = "deal_recommendation_card") {
                                            Card(
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = CardDefaults.cardColors(containerColor = Color(0xFF16122C)),
                                                shape = RoundedCornerShape(12.dp),
                                                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.35f))
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(12.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(34.dp)
                                                            .background(BuyWiseCyan.copy(alpha = 0.15f), CircleShape),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text("✨", fontSize = 16.sp)
                                                    }
                                                    Spacer(modifier = Modifier.width(10.dp))
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = if (isDualItemResult) "BUYWISE AI DUAL-OPTION RECOMMENDATION" else "BUYWISE AI DEAL RECOMMENDATION",
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = BuyWiseCyan
                                                        )
                                                        val cleanRec = remember(response.recommendation) {
                                                            val raw = response.recommendation?.trim() ?: ""
                                                            if (raw.contains("HTTP", ignoreCase = true) || raw.contains("Mock Fixture", ignoreCase = true) || raw.contains("server returned", ignoreCase = true) || raw.isBlank()) {
                                                                "BuyWise AI compares verified real-time prices across Amazon, Flipkart, Nykaa, and 14 leading stores to identify the best value deal."
                                                            } else {
                                                                raw
                                                            }
                                                        }
                                                        Spacer(modifier = Modifier.height(2.dp))
                                                        Text(
                                                            text = cleanRec,
                                                            fontSize = 12.sp,
                                                            color = Color.White,
                                                            lineHeight = 16.sp
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // Featured Dual-Tier Showcase: 1 Lowest Price Found + 1 Branded
                                    if (isDualItemResult) {
                                        item(key = "dual_tier_showcase") {
                                            val bestLowOffer = lowestPriceOffers.minByOrNull { it.price } ?: lowestPriceOffers.first()
                                            val bestBrdOffer = brandedOffers.minByOrNull { it.price } ?: brandedOffers.first()

                                            Column(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(vertical = 4.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Text(
                                                    text = "⚡ 2 OPTIONS FOUND: LOWEST PRICE & BRANDED",
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = BuyWiseCyan,
                                                    letterSpacing = 0.5.sp
                                                )

                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                                ) {
                                                    // Card 1: 👑 LOWEST PRICE FOUND
                                                    Card(
                                                        modifier = Modifier
                                                            .weight(1f)
                                                            .clickable {
                                                                viewModel.selectOffer(bestLowOffer)
                                                                onOfferSelect(bestLowOffer)
                                                            },
                                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF10241B)),
                                                        shape = RoundedCornerShape(12.dp),
                                                        border = BorderStroke(1.5.dp, BuyWiseEmerald.copy(alpha = 0.7f))
                                                    ) {
                                                        Column(modifier = Modifier.padding(10.dp)) {
                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                                modifier = Modifier.fillMaxWidth()
                                                            ) {
                                                                Box(
                                                                    modifier = Modifier
                                                                        .background(BuyWiseEmerald.copy(alpha = 0.25f), RoundedCornerShape(6.dp))
                                                                        .border(1.dp, BuyWiseEmerald, RoundedCornerShape(6.dp))
                                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                                ) {
                                                                    Text(
                                                                        text = "👑 LOWEST",
                                                                        fontSize = 9.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = BuyWiseEmerald
                                                                    )
                                                                }
                                                                Text(
                                                                    text = bestLowOffer.store,
                                                                    fontSize = 10.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = Color.LightGray
                                                                )
                                                            }

                                                            Spacer(modifier = Modifier.height(8.dp))

                                                            Box(
                                                                modifier = Modifier
                                                                    .fillMaxWidth()
                                                                    .height(64.dp)
                                                                    .background(Color(0xFF0B1712), RoundedCornerShape(8.dp)),
                                                                contentAlignment = Alignment.Center
                                                            ) {
                                                                if (!bestLowOffer.imageUrl.isNullOrBlank()) {
                                                                    AsyncImage(
                                                                        model = bestLowOffer.imageUrl,
                                                                        contentDescription = bestLowOffer.title,
                                                                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)),
                                                                        contentScale = ContentScale.Crop
                                                                    )
                                                                } else {
                                                                    Text("🏷️", fontSize = 24.sp)
                                                                }
                                                            }

                                                            Spacer(modifier = Modifier.height(6.dp))

                                                            Text(
                                                                text = bestLowOffer.title,
                                                                fontSize = 11.5.sp,
                                                                fontWeight = FontWeight.SemiBold,
                                                                color = Color.White,
                                                                maxLines = 2,
                                                                overflow = TextOverflow.Ellipsis,
                                                                lineHeight = 15.sp
                                                            )

                                                            Spacer(modifier = Modifier.height(6.dp))

                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                                modifier = Modifier.fillMaxWidth()
                                                            ) {
                                                                Column {
                                                                    Text(
                                                                        text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(bestLowOffer.price.toInt())}",
                                                                        fontSize = 15.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = BuyWiseEmerald
                                                                    )
                                                                    if (bestLowOffer.mrp != null && bestLowOffer.mrp > bestLowOffer.price) {
                                                                        Text(
                                                                            text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(bestLowOffer.mrp.toInt())}",
                                                                            fontSize = 10.sp,
                                                                            color = Color.Gray,
                                                                            textDecoration = TextDecoration.LineThrough
                                                                        )
                                                                    }
                                                                }

                                                                Box(
                                                                    modifier = Modifier
                                                                        .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                                                        .padding(horizontal = 6.dp, vertical = 3.dp)
                                                                ) {
                                                                    Text("DEAL ➔", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                                                                }
                                                            }
                                                        }
                                                    }

                                                    // Card 2: 💎 BRANDED CHOICE
                                                    Card(
                                                        modifier = Modifier
                                                            .weight(1f)
                                                            .clickable {
                                                                viewModel.selectOffer(bestBrdOffer)
                                                                onOfferSelect(bestBrdOffer)
                                                            },
                                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1535)),
                                                        shape = RoundedCornerShape(12.dp),
                                                        border = BorderStroke(1.5.dp, Color(0xFF9D6DF9).copy(alpha = 0.7f))
                                                    ) {
                                                        Column(modifier = Modifier.padding(10.dp)) {
                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                                modifier = Modifier.fillMaxWidth()
                                                            ) {
                                                                Box(
                                                                    modifier = Modifier
                                                                        .background(Color(0xFF8B5CF6).copy(alpha = 0.25f), RoundedCornerShape(6.dp))
                                                                        .border(1.dp, Color(0xFFA78BFA), RoundedCornerShape(6.dp))
                                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                                ) {
                                                                    Text(
                                                                        text = "💎 BRANDED",
                                                                        fontSize = 9.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = Color(0xFFC4B5FD)
                                                                    )
                                                                }
                                                                Text(
                                                                    text = bestBrdOffer.store,
                                                                    fontSize = 10.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = Color.LightGray
                                                                )
                                                            }

                                                            Spacer(modifier = Modifier.height(8.dp))

                                                            Box(
                                                                modifier = Modifier
                                                                    .fillMaxWidth()
                                                                    .height(64.dp)
                                                                    .background(Color(0xFF100C24), RoundedCornerShape(8.dp)),
                                                                contentAlignment = Alignment.Center
                                                            ) {
                                                                if (!bestBrdOffer.imageUrl.isNullOrBlank()) {
                                                                    AsyncImage(
                                                                        model = bestBrdOffer.imageUrl,
                                                                        contentDescription = bestBrdOffer.title,
                                                                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)),
                                                                        contentScale = ContentScale.Crop
                                                                    )
                                                                } else {
                                                                    Text("💎", fontSize = 24.sp)
                                                                }
                                                            }

                                                            Spacer(modifier = Modifier.height(6.dp))

                                                            Text(
                                                                text = bestBrdOffer.title,
                                                                fontSize = 11.5.sp,
                                                                fontWeight = FontWeight.SemiBold,
                                                                color = Color.White,
                                                                maxLines = 2,
                                                                overflow = TextOverflow.Ellipsis,
                                                                lineHeight = 15.sp
                                                            )

                                                            Spacer(modifier = Modifier.height(6.dp))

                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                                modifier = Modifier.fillMaxWidth()
                                                            ) {
                                                                Column {
                                                                    Text(
                                                                        text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(bestBrdOffer.price.toInt())}",
                                                                        fontSize = 15.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = Color(0xFFC4B5FD)
                                                                    )
                                                                    if (bestBrdOffer.mrp != null && bestBrdOffer.mrp > bestBrdOffer.price) {
                                                                        Text(
                                                                            text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(bestBrdOffer.mrp.toInt())}",
                                                                            fontSize = 10.sp,
                                                                            color = Color.Gray,
                                                                            textDecoration = TextDecoration.LineThrough
                                                                        )
                                                                    }
                                                                }

                                                                Box(
                                                                    modifier = Modifier
                                                                        .background(Color(0xFF8B5CF6).copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                                                        .padding(horizontal = 6.dp, vertical = 3.dp)
                                                                ) {
                                                                    Text("DEAL ➔", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFC4B5FD))
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                        // Multi-Retailer Comparison Mode Selector (Google Shopping Style)
                                        item(key = "comparison_mode_selector") {
                                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    val bestCount = response.bestMatches.ifEmpty { response.stores }.size
                                                    val sameCount = response.sameProductComparisons.size
                                                    val allCount = response.stores.size

                                                    val modeTabs = listOf(
                                                        Triple("BEST_MATCHES", "🌟 Best Matches ($bestCount)", BuyWiseCyan),
                                                        Triple("SAME_PRODUCT", "🎯 Same Product ($sameCount)", BuyWiseEmerald),
                                                        Triple("ALL_STORES", "🏪 All Stores ($allCount)", Color(0xFFC4B5FD))
                                                    )

                                                    modeTabs.forEach { (modeKey, modeLabel, activeColor) ->
                                                        val isSelected = selectedViewMode == modeKey
                                                        Box(
                                                            modifier = Modifier
                                                                .weight(1f)
                                                                .background(
                                                                    if (isSelected) activeColor.copy(alpha = 0.18f) else Color(0xFF1B172E),
                                                                    RoundedCornerShape(8.dp)
                                                                )
                                                                .border(
                                                                    1.dp,
                                                                    if (isSelected) activeColor else Color(0xFF2C2548),
                                                                    RoundedCornerShape(8.dp)
                                                                )
                                                                .clickable { selectedViewMode = modeKey }
                                                                .padding(vertical = 8.dp),
                                                            contentAlignment = Alignment.Center
                                                        ) {
                                                            Text(
                                                                text = modeLabel,
                                                                fontSize = 10.sp,
                                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                                color = if (isSelected) activeColor else Color.LightGray,
                                                                maxLines = 1,
                                                                overflow = TextOverflow.Ellipsis
                                                            )
                                                        }
                                                    }
                                                }

                                                Spacer(modifier = Modifier.height(6.dp))

                                                if (selectedViewMode == "BEST_MATCHES") {
                                                    Text(
                                                        text = "💡 Best Matches: Ranked by style, fabric & relevance. Compare exact identical models under 'Same Product'.",
                                                        fontSize = 11.sp,
                                                        color = Color.LightGray,
                                                        lineHeight = 14.sp
                                                    )
                                                } else if (selectedViewMode == "SAME_PRODUCT") {
                                                    Text(
                                                        text = "🎯 Same Product: Aggregating the identical brand & design across multiple online platforms.",
                                                        fontSize = 11.sp,
                                                        color = BuyWiseEmerald,
                                                        lineHeight = 14.sp
                                                    )
                                                } else {
                                                    Text(
                                                        text = "🏪 All Stores: Live stream of all detected store listings across 14 retailers.",
                                                        fontSize = 11.sp,
                                                        color = Color.Gray,
                                                        lineHeight = 14.sp
                                                    )
                                                }
                                            }
                                        }

                                        // Tier filter tabs (only in ALL_STORES mode)
                                        if (selectedViewMode == "ALL_STORES") {
                                            item(key = "tier_filter_tabs") {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    val bestLow = lowestPriceOffers.minOfOrNull { it.price }?.toInt() ?: 0
                                                    val bestBrd = brandedOffers.minOfOrNull { it.price }?.toInt() ?: 0

                                                    val tabs = listOf(
                                                        Triple("ALL", "All Offers (${response.stores.size})", Color.White),
                                                        Triple("LOWEST_PRICE", "👑 Lowest (₹$bestLow)", BuyWiseEmerald),
                                                        Triple("BRANDED", "💎 Branded (₹$bestBrd)", Color(0xFFC4B5FD))
                                                    )

                                                    tabs.forEach { (key, label, activeColor) ->
                                                        val isSelected = selectedTierFilter == key
                                                        Box(
                                                            modifier = Modifier
                                                                .background(
                                                                    if (isSelected) activeColor.copy(alpha = 0.18f) else Color(0xFF1B172E),
                                                                    RoundedCornerShape(20.dp)
                                                                )
                                                                .border(
                                                                    1.dp,
                                                                    if (isSelected) activeColor else Color.DarkGray.copy(alpha = 0.4f),
                                                                    RoundedCornerShape(20.dp)
                                                                )
                                                                .clickable { selectedTierFilter = key }
                                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                                        ) {
                                                            Text(
                                                                text = label,
                                                                fontSize = 11.sp,
                                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                                color = if (isSelected) activeColor else Color.LightGray
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                    // MODE 2: SAME PRODUCT MULTI-STORE COMPARISON
                                    if (selectedViewMode == "SAME_PRODUCT" && response.sameProductComparisons.isNotEmpty()) {
                                        items(
                                            items = response.sameProductComparisons,
                                            key = { group -> group.id }
                                        ) { group ->
                                            Card(
                                                modifier = Modifier.fillMaxWidth(),
                                                colors = CardDefaults.cardColors(containerColor = Color(0xFF151226)),
                                                shape = RoundedCornerShape(14.dp),
                                                border = BorderStroke(1.dp, BuyWiseEmerald.copy(alpha = 0.5f))
                                            ) {
                                                Column(modifier = Modifier.padding(14.dp)) {
                                                    Row(modifier = Modifier.fillMaxWidth()) {
                                                        Box(
                                                            modifier = Modifier
                                                                .size(64.dp)
                                                                .background(Color(0xFF0F0C1B), RoundedCornerShape(8.dp)),
                                                            contentAlignment = Alignment.Center
                                                        ) {
                                                            if (!group.primaryImageUrl.isNullOrBlank()) {
                                                                AsyncImage(
                                                                    model = group.primaryImageUrl,
                                                                    contentDescription = group.productTitle,
                                                                    modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)),
                                                                    contentScale = ContentScale.Crop
                                                                )
                                                            } else {
                                                                Text("👗", fontSize = 24.sp)
                                                            }
                                                        }

                                                        Spacer(modifier = Modifier.width(10.dp))

                                                        Column(modifier = Modifier.weight(1f)) {
                                                            Text(
                                                                text = group.productTitle,
                                                                fontSize = 13.5.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = Color.White,
                                                                maxLines = 2,
                                                                overflow = TextOverflow.Ellipsis
                                                            )
                                                            if (!group.variantInfo.isNullOrBlank()) {
                                                                Spacer(modifier = Modifier.height(2.dp))
                                                                Text(
                                                                    text = "🌿 ${group.variantInfo}",
                                                                    fontSize = 10.5.sp,
                                                                    color = BuyWiseEmerald,
                                                                    fontWeight = FontWeight.SemiBold
                                                                )
                                                            }
                                                            Spacer(modifier = Modifier.height(4.dp))
                                                            Text(
                                                                text = "Compared across ${group.storeCount} online stores: from ₹${group.lowestPrice.toInt()}",
                                                                fontSize = 11.sp,
                                                                color = BuyWiseCyan,
                                                                fontWeight = FontWeight.Bold
                                                            )
                                                        }
                                                    }

                                                    Spacer(modifier = Modifier.height(10.dp))
                                                    HorizontalDivider(color = Color(0xFF231E3D), thickness = 1.dp)
                                                    Spacer(modifier = Modifier.height(8.dp))

                                                    // Multi-store listing rows
                                                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                                        group.offers.forEach { storeOffer ->
                                                            Row(
                                                                modifier = Modifier
                                                                    .fillMaxWidth()
                                                                    .background(Color(0xFF1B1730), RoundedCornerShape(8.dp))
                                                                    .clickable {
                                                                        viewModel.selectOffer(storeOffer)
                                                                        onOfferSelect(storeOffer)
                                                                    }
                                                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.SpaceBetween
                                                            ) {
                                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                                    Box(
                                                                        modifier = Modifier
                                                                            .background(getStoreBadgeColor(storeOffer.store), RoundedCornerShape(4.dp))
                                                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                                                    ) {
                                                                        Text(storeOffer.store, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                                                    }
                                                                    if (storeOffer.price == group.lowestPrice) {
                                                                        Text("👑 Lowest", fontSize = 9.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                                                                    }
                                                                }

                                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                                    Text(
                                                                        text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(storeOffer.price.toInt())}",
                                                                        fontSize = 14.sp,
                                                                        fontWeight = FontWeight.Bold,
                                                                        color = if (storeOffer.price == group.lowestPrice) BuyWiseEmerald else Color.White
                                                                    )
                                                                    Box(
                                                                        modifier = Modifier
                                                                            .background(BuyWiseCyan.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                                                    ) {
                                                                        Text("VIEW ➔", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = BuyWiseCyan)
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        // MODES 1 & 3: BEST MATCHES & ALL STORES
                                        val activeList = if (selectedViewMode == "BEST_MATCHES") {
                                            response.bestMatches.ifEmpty { displayedOffers }
                                        } else {
                                            displayedOffers
                                        }

                                        items(
                                            items = activeList,
                                            key = { offer -> "${offer.store}_${offer.price}_${offer.title.hashCode()}" }
                                        ) { offer ->
                                            Card(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable {
                                                        viewModel.selectOffer(offer)
                                                        onOfferSelect(offer)
                                                    },
                                                colors = CardDefaults.cardColors(containerColor = Color(0xFF161326)),
                                                shape = RoundedCornerShape(14.dp),
                                                border = BorderStroke(
                                                    width = if (offer.isLowest == true || offer.matchType == "LOWEST_PRICE") 1.5.dp else 1.dp,
                                                    color = if (offer.matchType == "LOWEST_PRICE" || offer.isLowest == true) BuyWiseEmerald.copy(alpha = 0.6f)
                                                            else if (offer.matchType == "BRANDED") Color(0xFFA78BFA).copy(alpha = 0.6f)
                                                            else if (offer.isBestValue == true) BuyWiseGold.copy(alpha = 0.5f)
                                                            else Color(0xFF28233D)
                                                )
                                            ) {

                                            Column(modifier = Modifier.padding(12.dp)) {
                                                // Header Row: Store badge + Lowest/Best Value + Trust score
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                    ) {
                                                        Box(
                                                            modifier = Modifier
                                                                .background(getStoreBadgeColor(offer.store), RoundedCornerShape(6.dp))
                                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                                        ) {
                                                            Text(
                                                                text = offer.store,
                                                                fontSize = 11.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = Color.White
                                                            )
                                                        }

                                                        if (offer.matchType == "LOWEST_PRICE") {
                                                            Box(
                                                                modifier = Modifier
                                                                    .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                                                    .border(1.dp, BuyWiseEmerald, RoundedCornerShape(6.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            ) {
                                                                Text(
                                                                    text = "👑 LOWEST",
                                                                    fontSize = 9.5.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = BuyWiseEmerald
                                                                )
                                                            }
                                                        } else if (offer.matchType == "BRANDED") {
                                                            Box(
                                                                modifier = Modifier
                                                                    .background(Color(0xFF8B5CF6).copy(alpha = 0.25f), RoundedCornerShape(6.dp))
                                                                    .border(1.dp, Color(0xFFA78BFA), RoundedCornerShape(6.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            ) {
                                                                Text(
                                                                    text = "💎 BRANDED",
                                                                    fontSize = 9.5.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = Color(0xFFC4B5FD)
                                                                )
                                                            }
                                                        } else if (offer.isLowest == true) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                                                    .border(1.dp, BuyWiseEmerald, RoundedCornerShape(6.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            ) {
                                                                Text(
                                                                    text = "👑 LOWEST",
                                                                    fontSize = 9.5.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = BuyWiseEmerald
                                                                )
                                                            }
                                                        } else if (offer.isBestValue == true) {
                                                            Box(
                                                                modifier = Modifier
                                                                    .background(BuyWiseGold.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                                                    .border(1.dp, BuyWiseGold, RoundedCornerShape(6.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            ) {
                                                                Text(
                                                                    text = "⭐ BEST VALUE",
                                                                    fontSize = 9.5.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = BuyWiseGold
                                                                )
                                                            }
                                                        }
                                                    }

                                                    Text(
                                                        text = "🛡️ Trust: ${offer.trustScore ?: 95}/100",
                                                        fontSize = 11.5.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = BuyWiseEmerald
                                                    )
                                                }

                                                Spacer(modifier = Modifier.height(10.dp))

                                                // Body Row: Product Thumbnail + Title + Pricing
                                                Row(modifier = Modifier.fillMaxWidth()) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(76.dp)
                                                            .background(Color(0xFF0F0C1B), RoundedCornerShape(10.dp))
                                                            .border(1.dp, Color(0xFF28233D), RoundedCornerShape(10.dp)),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        if (!offer.imageUrl.isNullOrBlank()) {
                                                            AsyncImage(
                                                                model = offer.imageUrl,
                                                                contentDescription = offer.title,
                                                                modifier = Modifier
                                                                    .fillMaxSize()
                                                                    .clip(RoundedCornerShape(10.dp)),
                                                                contentScale = ContentScale.Crop
                                                            )
                                                        } else {
                                                            Text("🛍️", fontSize = 26.sp)
                                                        }
                                                    }

                                                    Spacer(modifier = Modifier.width(10.dp))

                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = offer.title,
                                                            fontSize = 13.5.sp,
                                                            fontWeight = FontWeight.SemiBold,
                                                            color = Color.White,
                                                            maxLines = 2,
                                                            overflow = TextOverflow.Ellipsis,
                                                            lineHeight = 18.sp
                                                        )

                                                        Spacer(modifier = Modifier.height(4.dp))

                                                        if (!offer.fabric.isNullOrBlank() || !offer.style.isNullOrBlank() || offer.isSearchLinkOnly == true) {
                                                            Row(
                                                                modifier = Modifier.padding(vertical = 2.dp),
                                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                                verticalAlignment = Alignment.CenterVertically
                                                            ) {
                                                                if (!offer.fabric.isNullOrBlank()) {
                                                                    Box(
                                                                        modifier = Modifier
                                                                            .background(Color(0xFF0D251C), RoundedCornerShape(4.dp))
                                                                            .padding(horizontal = 5.dp, vertical = 2.dp)
                                                                    ) {
                                                                        Text(text = "🌿 ${offer.fabric}", fontSize = 9.5.sp, color = BuyWiseEmerald, fontWeight = FontWeight.SemiBold)
                                                                    }
                                                                }
                                                                if (!offer.style.isNullOrBlank()) {
                                                                    Box(
                                                                        modifier = Modifier
                                                                            .background(Color(0xFF1E1738), RoundedCornerShape(4.dp))
                                                                            .padding(horizontal = 5.dp, vertical = 2.dp)
                                                                    ) {
                                                                        Text(text = "👗 ${offer.style}", fontSize = 9.5.sp, color = Color(0xFFC4B5FD))
                                                                    }
                                                                }
                                                                if (offer.isSearchLinkOnly == true) {
                                                                    Box(
                                                                        modifier = Modifier
                                                                            .background(Color(0xFF262338), RoundedCornerShape(4.dp))
                                                                            .padding(horizontal = 5.dp, vertical = 2.dp)
                                                                    ) {
                                                                        Text(text = "🔗 Direct Search Link", fontSize = 9.sp, color = Color.LightGray)
                                                                    }
                                                                }
                                                            }
                                                            Spacer(modifier = Modifier.height(3.dp))
                                                        }

                                                        if (offer.rating != null) {
                                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                                Text("★ ${offer.rating}", fontSize = 11.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                                                                if (offer.reviewCount != null) {
                                                                    Text(
                                                                        text = " (${NumberFormat.getIntegerInstance().format(offer.reviewCount)})",
                                                                        fontSize = 10.5.sp,
                                                                        color = Color.Gray
                                                                    )
                                                                }
                                                            }
                                                            Spacer(modifier = Modifier.height(4.dp))
                                                        }


                                                        // Price & Discount Line
                                                        Row(
                                                            modifier = Modifier.fillMaxWidth(),
                                                            verticalAlignment = Alignment.CenterVertically,
                                                            horizontalArrangement = Arrangement.SpaceBetween
                                                        ) {
                                                            Row(verticalAlignment = Alignment.Bottom) {
                                                                Text(
                                                                    text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(offer.price.toInt())}",
                                                                    fontSize = 17.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = BuyWiseEmerald
                                                                )
                                                                if (offer.mrp != null && offer.mrp > offer.price) {
                                                                    Spacer(modifier = Modifier.width(6.dp))
                                                                    Text(
                                                                        text = "₹${NumberFormat.getIntegerInstance(Locale.forLanguageTag("en-IN")).format(offer.mrp.toInt())}",
                                                                        fontSize = 12.sp,
                                                                        color = Color.Gray,
                                                                        textDecoration = TextDecoration.LineThrough
                                                                    )
                                                                }
                                                                if (offer.discount != null && offer.discount > 0) {
                                                                    val dVal = if (offer.mrp != null && offer.mrp > offer.price) {
                                                                        val calc = (((offer.mrp - offer.price) / offer.mrp) * 100).toInt()
                                                                        if (calc in 1..95) calc else offer.discount.toInt().coerceIn(1, 90)
                                                                    } else if (offer.discount.toInt() in 1..95) {
                                                                        offer.discount.toInt()
                                                                    } else {
                                                                        0
                                                                    }
                                                                    if (dVal > 0) {
                                                                        Spacer(modifier = Modifier.width(6.dp))
                                                                        Text(
                                                                            text = "$dVal% OFF",
                                                                            fontSize = 10.5.sp,
                                                                            fontWeight = FontWeight.Bold,
                                                                            color = Color(0xFFFF7A00)
                                                                        )
                                                                    }
                                                                }
                                                            }

                                                            Box(
                                                                modifier = Modifier
                                                                    .background(BuyWiseCyan.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                                                    .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                                                    .clickable {
                                                                        viewModel.selectOffer(offer)
                                                                        onOfferSelect(offer)
                                                                    }
                                                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                                                            ) {
                                                                Text(
                                                                    text = "VIEW DEAL ➔",
                                                                    fontSize = 10.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = BuyWiseCyan
                                                                )
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    item(key = "bottom_spacer") {
                                        Spacer(modifier = Modifier.height(28.dp))
                                    }
                                }
                            }
                        }
                        }
                        is SmartCompareUiState.Idle -> {
                            // Welcoming initial state with popular categories
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "SmartCompare Matrix",
                                    color = BuyWiseCyan,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Search any product to view real price & trust aggregation across 14 stores",
                                    color = Color.LightGray,
                                    fontSize = 13.sp,
                                    modifier = Modifier.padding(horizontal = 24.dp),
                                    lineHeight = 18.sp
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { executeSearch(query) },
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Compare \"$query\"", color = Color.Black, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // Floating Mini-Header Pill when in Full-Screen Mode (!isHeaderVisible)
            AnimatedVisibility(
                visible = !isHeaderVisible,
                enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
                exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 10.dp, start = 14.dp, end = 14.dp)
            ) {
                Surface(
                    color = Color(0xEE161326),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.6f)),
                    shadowElevation = 8.dp,
                    modifier = Modifier
                        .clickable { isHeaderVisible = true }
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .background(Color(0xFF231E3D), CircleShape)
                                .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), CircleShape)
                                .clickable { onBack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text("←", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Text(
                            text = query.ifBlank { "Compare" },
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )

                        Box(
                            modifier = Modifier
                                .background(BuyWiseCyan.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "Search 🔍",
                                color = BuyWiseCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Voice Search Status Dialog
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
                                    text = "${tr("searching")} (14 stores)...",
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
        }
    }
}

private fun getStoreBadgeColor(store: String): Color {
    val lower = store.lowercase()
    return when {
        lower.contains("amazon") -> Color(0xFF232F3E)
        lower.contains("flipkart") -> Color(0xFF1A5BB8)
        lower.contains("croma") -> Color(0xFF006666)
        lower.contains("reliance") -> Color(0xFFB81B1F)
        lower.contains("myntra") -> Color(0xFFC2185B)
        lower.contains("ajio") -> Color(0xFF2C4152)
        lower.contains("nykaa") -> Color(0xFFD81B60)
        lower.contains("meesho") -> Color(0xFF6A1B9A)
        lower.contains("blinkit") -> Color(0xFFB78103)
        lower.contains("zepto") -> Color(0xFF5B1069)
        lower.contains("partner") || lower.contains("buywise") -> Color(0xFF6C2BD9)
        else -> Color(0xFF2C2548)
    }
}
