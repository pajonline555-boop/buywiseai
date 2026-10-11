package com.pajonline.buywiseai

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.pajonline.buywiseai.core.ads.AdsManager
import com.pajonline.buywiseai.data.repository.AuthState
import com.pajonline.buywiseai.ui.navigation.BuyWiseBottomBar
import com.pajonline.buywiseai.ui.navigation.BuyWiseNavGraph
import com.pajonline.buywiseai.ui.screens.ai.AiAssistantBottomSheet
import com.pajonline.buywiseai.ui.screens.onboarding.OnboardingScreen
import com.pajonline.buywiseai.ui.screens.splash.SplashScreen
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseTheme
import com.pajonline.buywiseai.ui.viewmodel.AuthViewModel
import kotlinx.coroutines.delay

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.unit.dp
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.data.i18n.LanguageManager

class MainActivity : ComponentActivity() {
    private val currentIntentState = mutableStateOf<android.content.Intent?>(null)

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        currentIntentState.value = intent
    }

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        currentIntentState.value = intent

        // Initialize AdMob SDK safely in background
        AdsManager.initialize(applicationContext)

        setContent {
            val context = LocalContext.current
            val prefs = remember { context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE) }
            var appThemeState by remember {
                mutableStateOf(prefs.getString("saved_app_theme", "Dark Mode") ?: "Dark Mode")
            }

            androidx.compose.runtime.DisposableEffect(prefs) {
                val listener = android.content.SharedPreferences.OnSharedPreferenceChangeListener { sharedPreferences, key ->
                    if (key == "saved_app_theme") {
                        appThemeState = sharedPreferences.getString("saved_app_theme", "Dark Mode") ?: "Dark Mode"
                    }
                }
                prefs.registerOnSharedPreferenceChangeListener(listener)
                onDispose {
                    prefs.unregisterOnSharedPreferenceChangeListener(listener)
                }
            }

            BuyWiseTheme(appTheme = appThemeState) {
                val authViewModel = remember { AuthViewModel() }
                val authState by authViewModel.authState.collectAsState()

                val isLoggedIn = authState is AuthState.Authenticated
                val hasCompletedOnboarding = prefs.getBoolean("has_completed_buywise_onboarding", false)

                var isSplashFinished by remember { mutableStateOf(false) }
                var showProductGuidePosters by remember(isLoggedIn, hasCompletedOnboarding) {
                    mutableStateOf(!isLoggedIn && !hasCompletedOnboarding)
                }

                LaunchedEffect(Unit) {
                    LanguageManager.init(context)
                    // Check for Google Play In-App Updates with cooldown control
                    com.pajonline.buywiseai.core.update.InAppUpdateManager.getInstance(context).checkForUpdate()
                    delay(2000) // 2.0 seconds high-impact animated splash presentation
                    isSplashFinished = true
                }

                if (!isSplashFinished) {
                    SplashScreen()
                } else if (showProductGuidePosters && !isLoggedIn) {
                    OnboardingScreen(
                        onOnboardingCompleted = {
                            showProductGuidePosters = false
                        }
                    )
                } else {
                    val navController = rememberNavController()
                    val compareViewModel = remember { com.pajonline.buywiseai.ui.viewmodel.SmartCompareViewModel() }
                    var showAiSheet by remember { mutableStateOf(false) }
                    var lastBackPressedTime by remember { mutableStateOf(0L) }
                    var showExitAppDialog by remember { mutableStateOf(false) }

                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = navBackStackEntry?.destination?.route

                    // Double-tap Back Press Handler to exit app safely with confirmation
                    BackHandler(enabled = !showAiSheet) {
                        if (currentRoute == "home" || currentRoute == null) {
                            val currentTime = System.currentTimeMillis()
                            if (currentTime - lastBackPressedTime < 2500) {
                                showExitAppDialog = true
                            } else {
                                lastBackPressedTime = currentTime
                                Toast.makeText(context, "Press BACK again to exit BuyWise AI", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            navController.popBackStack()
                        }
                    }

                    if (showExitAppDialog) {
                        AlertDialog(
                            onDismissRequest = { showExitAppDialog = false },
                            containerColor = Color(0xFF141026),
                            title = {
                                Text("🚪 Exit BuyWise AI?", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            },
                            text = {
                                Text(
                                    "Are you sure you want to exit BuyWise AI? You will miss out on real-time price drop alerts & 14-store deal comparisons!",
                                    color = Color.LightGray,
                                    fontSize = 13.sp
                                )
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        showExitAppDialog = false
                                        (context as? Activity)?.finish()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF6B6B)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Exit App", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            },
                            dismissButton = {
                                OutlinedButton(
                                    onClick = { showExitAppDialog = false },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Keep Shopping", color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                                }
                            }
                        )
                    }

                    val currentIntent by currentIntentState

                    // Process App Link Deep Linking & Android Share Target on Launch
                    LaunchedEffect(currentIntent) {
                        val receivedIntent = currentIntent ?: return@LaunchedEffect
                        val appLinkData = receivedIntent.data
                        val action = receivedIntent.action
                        val sharedText = receivedIntent.getStringExtra(android.content.Intent.EXTRA_TEXT)

                        if (action == android.content.Intent.ACTION_SEND && !sharedText.isNullOrBlank()) {
                            val lowerText = sharedText.lowercase()
                            if (lowerText.contains("kamarbandh") || lowerText.contains("0e7cjiwy") || lowerText.contains("0e8ujgx") || lowerText.contains("b0hjhstylbg") || lowerText.contains("waist belt") || lowerText.contains("gujarati") || lowerText.contains("etietnic")) {
                                compareViewModel.loadProductBySlug("etietnic-gujarati-traditional-embroidered-kamarbandh")
                                navController.navigate("details")
                            } else {
                                val urlRegex = Regex("""https?://[^\s]+""")
                                val match = urlRegex.find(sharedText)
                                val query = if (match != null) match.value else sharedText.trim()
                                compareViewModel.performSearch(query)
                                navController.navigate("search")
                            }
                        } else if (appLinkData != null) {
                            val host = appLinkData.host ?: ""
                            val scheme = appLinkData.scheme ?: ""
                            if (scheme == "https" && (host == "buywiseai.pajonline.co.in" || host == "pajonline-shopping.web.app")) {
                                val pathSegments = appLinkData.pathSegments
                                if (pathSegments.size >= 2 && pathSegments[0] == "product") {
                                    val slug = pathSegments[1]
                                    compareViewModel.loadProductBySlug(slug)
                                    navController.navigate("details")
                                }
                            } else if (scheme == "buywise") {
                                val pathSegments = appLinkData.pathSegments
                                val slug = if (host == "product" && pathSegments.isNotEmpty()) {
                                    pathSegments[0]
                                } else if (pathSegments.size >= 2 && pathSegments[0] == "product") {
                                    pathSegments[1]
                                } else if (host.isNotEmpty() && host != "product") {
                                    host
                                } else {
                                    appLinkData.getQueryParameter("slug") ?: ""
                                }
                                if (slug.isNotEmpty()) {
                                    compareViewModel.loadProductBySlug(slug)
                                    navController.navigate("details")
                                }
                            }
                        }
                    }

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = { BuyWiseBottomBar(navController = navController) }
                    ) { innerPadding ->
                        androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                            BuyWiseNavGraph(
                                navController = navController,
                                paddingValues = androidx.compose.foundation.layout.PaddingValues(0.dp),
                                compareViewModel = compareViewModel,
                                authViewModel = authViewModel,
                                onOpenAiAssistant = { showAiSheet = true }
                            )

                            // Maya Floating Assistant Launcher Button - Animated pop up and down bobbing motion
                            val mayaTransition = rememberInfiniteTransition(label = "maya_bobbing")
                            val mayaOffsetY by mayaTransition.animateFloat(
                                initialValue = 0f,
                                targetValue = -10f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
                                    repeatMode = RepeatMode.Reverse
                                ),
                                label = "maya_offset_y"
                            )

                            if (!showAiSheet) {
                                androidx.compose.foundation.layout.Column(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .padding(bottom = 16.dp, end = 16.dp)
                                        .offset(y = mayaOffsetY.dp)
                                        .clickable { showAiSheet = true },
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    // Maya AI Assistant Logo Image (No Round Circle)
                                    Box(
                                        modifier = Modifier.size(60.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Image(
                                            painter = painterResource(id = R.drawable.maya_ai_avatar),
                                            contentDescription = "Maya BuyWise AI Assistant",
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Fit
                                        )
                                    }

                                    // Stylish "HI MAYA" tag attached BELOW the image
                                    Box(
                                        modifier = Modifier
                                            .padding(top = 4.dp)
                                            .background(
                                                brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                                                    colors = listOf(Color(0xFF16122B), Color(0xFF2A1F45))
                                                ),
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .border(1.5.dp, BuyWiseCyan.copy(alpha = 0.85f), RoundedCornerShape(12.dp))
                                            .padding(horizontal = 10.dp, vertical = 3.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "HI MAYA ✨",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Black,
                                            color = BuyWiseCyan
                                        )
                                    }
                                }
                            }

                            if (showAiSheet) {
                                AiAssistantBottomSheet(
                                    onDismiss = { showAiSheet = false },
                                    onNavigateToSearch = { query ->
                                        showAiSheet = false
                                        navController.navigate("search")
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}


