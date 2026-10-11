package com.pajonline.buywiseai.ui.screens.splash

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

@Composable
fun SplashScreen() {
    var startAnimation by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        startAnimation = true
    }

    val scaleState by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.82f,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "ScaleAnimation"
    )

    val alphaState by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 700),
        label = "AlphaAnimation"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "GlowTransition")
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "GlowPulse"
    )

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            BuyWisePurple.copy(alpha = 0.35f * glowPulse),
                            BuyWiseCyan.copy(alpha = 0.15f * glowPulse),
                            Color(0xFF0C0A14)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .scale(scaleState)
                    .alpha(alphaState)
                    .padding(24.dp)
            ) {
                // Top Tagline Badge Pill
                Box(
                    modifier = Modifier
                        .background(
                            Brush.horizontalGradient(
                                listOf(BuyWiseNeonPink.copy(alpha = 0.25f), BuyWiseCyan.copy(alpha = 0.25f))
                            ),
                            shape = RoundedCornerShape(20.dp)
                        )
                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "⚡ 14 STORES • AI PRICE COMPARISON & VIRTUAL TRY-ON",
                        color = BuyWiseCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 0.5.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Brand Logo Header
                BuyWiseLogo(logoHeight = 58.dp, fontSize = 34)

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Shop Smarter. Buy Better.",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Real-time price tracking, verified coupons & 3D clothing try-on",
                    color = Color.LightGray,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Loading Pulse Bar
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(4.dp)
                        .background(Color.White.copy(alpha = 0.15f), CircleShape)
                ) {
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxSize()
                            .alpha(glowPulse),
                        color = BuyWiseCyan,
                        trackColor = Color.Transparent
                    )
                }
            }
        }
    }
}
