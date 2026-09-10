package com.pajonline.buywiseai.ui.screens.onboarding

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.launch

data class OnboardingCardData(
    val title: String,
    val subtitle: String,
    val badge: String,
    val iconEmoji: String,
    val accentColor: Color,
    val secondaryColor: Color
)

@Composable
fun OnboardingScreen(
    onOnboardingCompleted: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val cards = remember {
        listOf(
            OnboardingCardData(
                title = "Welcome to BuyWise AI",
                subtitle = "Your intelligent shopping companion for real-time price tracking, virtual trial room & verified merchant deals.",
                badge = "⚡ NEXT-GEN E-COMMERCE AI",
                iconEmoji = "🛍️",
                accentColor = BuyWiseCyan,
                secondaryColor = Color(0xFF7000FF)
            ),
            OnboardingCardData(
                title = "Compare Before You Buy",
                subtitle = "Compare live prices, merchant ratings & price history graphs across 14 major retailers instantly.",
                badge = "🔍 LIVE PRICE INTELLIGENCE",
                iconEmoji = "⚡",
                accentColor = BuyWiseEmerald,
                secondaryColor = Color(0xFF00B4D8)
            ),
            OnboardingCardData(
                title = "Search Smarter with Voice & OCR",
                subtitle = "Speak naturally in Hindi, English or Hinglish using 🎙️ Voice Search, or snap a photo with Camera OCR.",
                badge = "🎙️ MULTI-MODAL SEARCH",
                iconEmoji = "🎙️",
                accentColor = BuyWiseGold,
                secondaryColor = Color(0xFFFF6D00)
            ),
            OnboardingCardData(
                title = "Try Before You Decide",
                subtitle = "Preview fashion items on yourself using BuyWise AI Virtual Trial Room before placing an order.",
                badge = "✨ AI VIRTUAL TRIAL ROOM",
                iconEmoji = "✨",
                accentColor = Color(0xFFFF007F),
                secondaryColor = Color(0xFF7928CA)
            ),
            OnboardingCardData(
                title = "Smart Value & Trust Score",
                subtitle = "Get AI deal scores, fraud protection badges, and price drop notifications before you pay.",
                badge = "🛡️ VERIFIED MERCHANT TRUST",
                iconEmoji = "🛡️",
                accentColor = BuyWiseEmerald,
                secondaryColor = Color(0xFF00F5D4)
            ),
            OnboardingCardData(
                title = "Discover BuyWise Store",
                subtitle = "Explore exclusive merchant catalogs, Gen-G offers, and manage orders with 1-click delivery tracking.",
                badge = "🏬 DIRECT MERCHANT STORE",
                iconEmoji = "🏬",
                accentColor = BuyWisePurple,
                secondaryColor = Color(0xFF4361EE)
            ),
            OnboardingCardData(
                title = "You're Ready to Shop Smarter!",
                subtitle = "Compare products, discover real deals, and shop with confidence on BuyWise AI.",
                badge = "🚀 START YOUR JOURNEY",
                iconEmoji = "🚀",
                accentColor = BuyWiseCyan,
                secondaryColor = Color(0xFF3A0CA3)
            )
        )
    }

    val pagerState = rememberPagerState(pageCount = { cards.size })

    fun completeOnboarding() {
        val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("has_completed_buywise_onboarding", true).apply()
        onOnboardingCompleted()
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF070512)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Header: Logo & Skip Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                BuyWiseLogo(logoHeight = 36.dp, fontSize = 20)
                TextButton(onClick = { completeOnboarding() }) {
                    Text(
                        text = "SKIP",
                        color = Color.Gray,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Swipeable Horizontal Pager for Cards
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(vertical = 16.dp)
            ) { page ->
                val card = cards[page]
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF141028)),
                        shape = RoundedCornerShape(28.dp),
                        border = BorderStroke(
                            1.5.dp,
                            Brush.horizontalGradient(
                                listOf(
                                    card.accentColor.copy(alpha = 0.8f),
                                    card.secondaryColor.copy(alpha = 0.4f)
                                )
                            )
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Badge Pill
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(card.accentColor.copy(alpha = 0.15f))
                                    .border(1.dp, card.accentColor.copy(alpha = 0.5f), CircleShape)
                                    .padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = card.badge,
                                    color = card.accentColor,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            // Large Glowing Poster Icon Circle
                            Box(
                                modifier = Modifier
                                    .size(100.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.radialGradient(
                                            colors = listOf(
                                                card.accentColor.copy(alpha = 0.35f),
                                                card.secondaryColor.copy(alpha = 0.1f),
                                                Color.Transparent
                                            )
                                        )
                                    )
                                    .border(2.dp, card.accentColor.copy(alpha = 0.6f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = card.iconEmoji, fontSize = 48.sp)
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            // Title
                            Text(
                                text = card.title,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Subtitle
                            Text(
                                text = card.subtitle,
                                fontSize = 13.sp,
                                color = Color(0xFFC0C0D4),
                                textAlign = TextAlign.Center,
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }

            // Page Indicator Dots & Navigation Buttons Container
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Page Indicator Dots
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 20.dp)
                ) {
                    cards.indices.forEach { index ->
                        val isSelected = index == pagerState.currentPage
                        val activeColor = cards[pagerState.currentPage].accentColor
                        Box(
                            modifier = Modifier
                                .height(8.dp)
                                .width(if (isSelected) 24.dp else 8.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) activeColor else Color(0xFF332D48))
                        )
                    }
                }

                // Bottom Navigation Row: Back & Next
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (pagerState.currentPage > 0) {
                        TextButton(
                            onClick = {
                                scope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage - 1)
                                }
                            }
                        ) {
                            Text(
                                text = "‹ Back",
                                color = Color.LightGray,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.width(60.dp))
                    }

                    val currentCard = cards[pagerState.currentPage]
                    Button(
                        onClick = {
                            if (pagerState.currentPage < cards.size - 1) {
                                scope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage + 1)
                                }
                            } else {
                                completeOnboarding()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = currentCard.accentColor),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Text(
                            text = if (pagerState.currentPage == cards.size - 1) "START SHOPPING ➔" else "NEXT ➔",
                            color = Color.Black,
                            fontWeight = FontWeight.Black,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}
