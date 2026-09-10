package com.pajonline.buywiseai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.pajonline.buywiseai.ui.navigation.BuyWiseBottomBar
import com.pajonline.buywiseai.ui.navigation.BuyWiseNavGraph
import com.pajonline.buywiseai.ui.screens.ai.AiAssistantBottomSheet
import com.pajonline.buywiseai.ui.theme.BuyWiseTheme

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BuyWiseTheme {
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
