package com.pajonline.buywiseai.ui.screens.prime

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.data.repository.PrimeState
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.viewmodel.PrimeViewModel

@Composable
fun PrimeScreen(
    primeViewModel: PrimeViewModel = remember { PrimeViewModel() },
    onNavigateToWeb: (title: String, url: String) -> Unit = { _, _ -> }
) {
    val primeState by primeViewModel.primeState.collectAsState()
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isProcessing by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF070510)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Text(
                text = "👑 BUYWISE PRIME",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = BuyWiseGold
            )
            Text(
                text = "Cross-Platform Digital Membership",
                fontSize = 13.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Current Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF19142E)),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    when (val state = primeState) {
                        is PrimeState.Active -> {
                            Text(
                                text = "🟢 PRIME ACTIVE (${state.plan})",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = BuyWiseEmerald
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Source: ${state.source} • Valid until ${state.expiresAt.take(10)}",
                                fontSize = 12.sp,
                                color = Color.LightGray
                            )
                        }
                        else -> {
                            Text(
                                text = "⚪ BUYWISE FREE PLAN",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Upgrade to Prime for Unlimited VTO & Priority Alerts",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Benefits Card
            Text(
                text = "Prime Benefits",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(8.dp))

            val benefits = listOf(
                "👗 Unlimited AI Virtual Try-On",
                "⚡ Priority GPU Studio Rendering",
                "🔥 Instant Price Drop Push Alerts",
                "🏬 Exclusive Gen-G Partner Discounts",
                "🌐 Cross-Platform Web & Mobile Sync"
            )

            benefits.forEach { benefit ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = benefit,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Sandbox Play Token Test Action
            Button(
                onClick = {
                    isProcessing = true
                    statusMessage = null
                    primeViewModel.verifyGooglePlayToken("sandbox_token_android_${System.currentTimeMillis()}", "buywise_prime_monthly") { success, msg ->
                        isProcessing = false
                        statusMessage = msg
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                shape = RoundedCornerShape(14.dp),
                enabled = !isProcessing
            ) {
                Text(
                    text = if (isProcessing) "VERIFYING..." else "⚡ TEST GOOGLE PLAY PURCHASING (SANDBOX)",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedButton(
                onClick = { onNavigateToWeb("BuyWise Prime Web Portal", "/prime") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("🌐 Open Web Prime Portal", color = BuyWiseCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }

            statusMessage?.let { msg ->
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = msg,
                    color = BuyWiseEmerald,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "⚠️ COMMERCIAL PAYMENT GATEWAY NOT LIVE. Operating in Sandbox/Readiness Mode.",
                color = Color.Gray,
                fontSize = 10.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
