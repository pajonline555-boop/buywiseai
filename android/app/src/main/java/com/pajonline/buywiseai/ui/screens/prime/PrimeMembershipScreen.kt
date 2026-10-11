package com.pajonline.buywiseai.ui.screens.prime

import android.app.Activity
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pajonline.buywiseai.core.billing.BillingState
import com.pajonline.buywiseai.core.billing.GooglePlayBillingManager
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.viewmodel.PrimeViewModel

@Composable
fun PrimeMembershipScreen(
    onBack: () -> Unit = {},
    viewModel: PrimeViewModel = viewModel()
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val uiState by viewModel.uiState.collectAsState()
    val billingState by (viewModel.billingState?.collectAsState() ?: remember { mutableStateOf(BillingState.Idle) })

    LaunchedEffect(Unit) {
        viewModel.initBilling(context)
    }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF070510))
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // TOP HEADER BAR
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Text("←", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
            Text(
                text = "BuyWise Prime",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.width(48.dp))
        }

        // HERO CARD
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(Color(0xFF7C3AED).copy(alpha = 0.35f), Color(0xFFFF007F).copy(alpha = 0.2f))
                    ),
                    shape = RoundedCornerShape(24.dp)
                )
                .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(24.dp))
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .background(
                            brush = Brush.linearGradient(listOf(Color(0xFFFFD700), Color(0xFFFF8C00))),
                            shape = RoundedCornerShape(20.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "👑 BUYWISE PRIME",
                        color = Color(0xFF090D16),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                }

                Text(
                    text = "Elevate Your AI Shopping Experience",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center,
                    lineHeight = 28.sp
                )

                Text(
                    text = "Unlock unlimited AI Virtual Try-On, instant price drop notifications, priority GPU processing, and exclusive partner brand savings.",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                // STATUS CARD
                Box(
                    modifier = Modifier
                        .padding(top = 8.dp)
                        .background(
                            if (uiState.isPrimeActive) BuyWiseEmerald.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        .border(
                            1.dp,
                            if (uiState.isPrimeActive) BuyWiseEmerald.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = if (uiState.isPrimeActive) "🟢 STATUS: PRIME ACTIVE (${uiState.planName})" else "⚪ STATUS: FREE PLAN",
                        color = if (uiState.isPrimeActive) BuyWiseEmerald else Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // STATUS OR ERROR MESSAGES
        uiState.statusMessage?.let { msg ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        if (uiState.isError) Color(0xFFFF4D4D).copy(alpha = 0.15f) else BuyWiseEmerald.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(16.dp)
                    )
                    .border(
                        1.dp,
                        if (uiState.isError) Color(0xFFFF4D4D).copy(alpha = 0.4f) else BuyWiseEmerald.copy(alpha = 0.4f),
                        shape = RoundedCornerShape(16.dp)
                    )
                    .padding(14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = msg,
                    color = if (uiState.isError) Color(0xFFFF4D4D) else BuyWiseEmerald,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }
        }

        // PLAN SELECTOR
        Text(
            text = "Choose Subscription Plan",
            color = Color.White,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth()
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // MONTHLY PLAN CARD
            val isMonthlySelected = uiState.selectedPlan == GooglePlayBillingManager.PRODUCT_MONTHLY
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        if (isMonthlySelected) Color(0xFF7C3AED).copy(alpha = 0.25f) else Color.White.copy(alpha = 0.03f),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .border(
                        if (isMonthlySelected) 2.dp else 1.dp,
                        if (isMonthlySelected) BuyWiseCyan else Color.White.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .clickable { viewModel.selectPlan(GooglePlayBillingManager.PRODUCT_MONTHLY) }
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Monthly Pass", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("₹199", color = BuyWiseCyan, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("per month", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                }
            }

            // YEARLY PLAN CARD
            val isYearlySelected = uiState.selectedPlan == GooglePlayBillingManager.PRODUCT_YEARLY
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        if (isYearlySelected) Color(0xFFFFD700).copy(alpha = 0.15f) else Color.White.copy(alpha = 0.03f),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .border(
                        if (isYearlySelected) 2.dp else 1.dp,
                        if (isYearlySelected) Color(0xFFFFD700) else Color.White.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .clickable { viewModel.selectPlan(GooglePlayBillingManager.PRODUCT_YEARLY) }
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFFD700), RoundedCornerShape(8.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("SAVE 37%", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                    Text("Annual Pass", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("₹1,499", color = Color(0xFFFFD700), fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("per year", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                }
            }
        }

        // INCLUDED BENEFITS LIST
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(20.dp))
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("✨ Included Prime Privileges", color = BuyWiseCyan, fontSize = 15.sp, fontWeight = FontWeight.Bold)

                listOf(
                    "👗 Unlimited AI Virtual Try-On" to "No daily image generation limits on sarees & outfits.",
                    "⚡ Priority GPU Processing" to "Instant VTO results processed ahead of free queues.",
                    "🔥 Real-Time Price Drop Alerts" to "Instant status bar notifications on tracked items.",
                    "🏬 Partner Brand Discounts" to "Exclusive net savings on Gen-G store purchases.",
                    "👑 Cross-Platform Entitlement" to "Single subscription active across Web and Android."
                ).forEach { (benefitTitle, benefitDesc) ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(benefitTitle, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // GOOGLE PLAY SUBSCRIBE CTA BUTTON
        Button(
            onClick = {
                if (activity != null) {
                    viewModel.purchaseSelectedPlan(activity)
                }
            },
            enabled = !uiState.isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Unspecified),
            contentPadding = PaddingValues(0.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(Color(0xFF7C3AED), Color(0xFFFF007F))
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text(
                        text = "💳 Subscribe with Google Play",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        Text(
            text = "🔒 Secure In-App Billing powered by Google Play Payments.",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 11.sp,
            textAlign = TextAlign.Center
        )
    }
}
