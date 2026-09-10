package com.pajonline.buywiseai

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.rememberNavController
import com.pajonline.buywiseai.core.ads.AdsManager
import com.pajonline.buywiseai.data.repository.AuthState
import com.pajonline.buywiseai.ui.navigation.BuyWiseBottomBar
import com.pajonline.buywiseai.ui.navigation.BuyWiseNavGraph
import com.pajonline.buywiseai.ui.screens.ai.AiAssistantBottomSheet
import com.pajonline.buywiseai.ui.screens.auth.MandatoryAuthScreen
import com.pajonline.buywiseai.ui.screens.onboarding.OnboardingScreen
import com.pajonline.buywiseai.ui.screens.splash.SplashScreen
import com.pajonline.buywiseai.ui.theme.BuyWiseTheme
import com.pajonline.buywiseai.ui.viewmodel.AuthViewModel
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize AdMob SDK safely in background
        AdsManager.initialize(applicationContext)

        setContent {
            BuyWiseTheme {
                val context = LocalContext.current
                val prefs = remember { context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE) }

                var isSplashFinished by remember { mutableStateOf(false) }
                var hasCompletedOnboarding by remember {
                    mutableStateOf(prefs.getBoolean("has_completed_buywise_onboarding", false))
                }

                LaunchedEffect(Unit) {
                    delay(1500) // 1.5 seconds non-blocking splash screen
                    isSplashFinished = true
                }

                val authViewModel = remember { AuthViewModel() }
                val authState by authViewModel.authState.collectAsState()

                if (!isSplashFinished) {
                    SplashScreen()
                } else if (authState is AuthState.Unauthenticated) {
                    MandatoryAuthScreen(
                        onAuthSuccess = { authViewModel.checkAuthState() },
                        authViewModel = authViewModel
                    )
                } else if (!hasCompletedOnboarding) {
                    OnboardingScreen(
                        onOnboardingCompleted = {
                            prefs.edit().putBoolean("has_completed_buywise_onboarding", true).apply()
                            hasCompletedOnboarding = true
                        }
                    )
                } else {
                    val navController = rememberNavController()
                    var showAiSheet by remember { mutableStateOf(false) }
                    val sheetState = rememberModalBottomSheetState()

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = { BuyWiseBottomBar(navController = navController) }
                    ) { innerPadding ->
                        BuyWiseNavGraph(
                            navController = navController,
                            paddingValues = innerPadding,
                            onOpenAiAssistant = { showAiSheet = true }
                        )

                        if (showAiSheet) {
                            AiAssistantBottomSheet(
                                sheetState = sheetState,
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


