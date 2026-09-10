package com.pajonline.buywiseai.ui.screens.onboarding

import android.content.Context
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

data class OnboardingCardData(
    val title: String,
    val subtitle: String,
    val iconEmoji: String,
    val accentColor: Color
)

@Composable
fun OnboardingScreen(
    onOnboardingCompleted: () -> Unit
) {
    val context = LocalContext.current
    var currentPage by remember { mutableIntStateOf(0) }

    val cards = remember {
        listOf(
            OnboardingCardData(
                title = "Welcome to BuyWise AI",
                subtitle = "Your intelligent shopping companion for live price comparison, virtual trial room, and verified deals.",
                iconEmoji = "🛍️",
                accentColor = BuyWiseCyan
            ),
            OnboardingCardData(
                title = "Compare Before You Buy",
                subtitle = "Compare products, prices, ratings, and available offers across 14 supported retailers instantly.",
                iconEmoji = "⚡",
                accentColor = BuyWiseEmerald
            ),
            OnboardingCardData(
                title = "Search Smarter",
                subtitle = "Type, speak using 🎙️ voice search (Hindi, English, Hinglish), or use product photo OCR to search.",
                iconEmoji = "🎙️",
                accentColor = BuyWiseGold
            ),
            OnboardingCardData(
                title = "Try Before You Decide",
                subtitle = "Use BuyWise AI Try-On where supported to preview eligible fashion products on your photos.",
                iconEmoji = "✨",
                accentColor = Color(0xFFFF007F)
            ),
            OnboardingCardData(
                title = "Smart Value + Shopping Trust",
                subtitle = "See independent shopping signals, price history graphs, and verified merchant scores before you decide.",
                iconEmoji = "🛡️",
                accentColor = BuyWiseEmerald
            ),
            OnboardingCardData(
                title = "Discover BuyWise Store",
                subtitle = "Explore partner merchant products, Gen-G specials, and track your orders seamlessly.",
                iconEmoji = "🏬",
                accentColor = BuyWisePurple
            ),
            OnboardingCardData(
                title = "You're Ready!",
                subtitle = "Compare. Discover. Shop smarter with BuyWise AI.",
                iconEmoji = "🚀",
                accentColor = BuyWiseCyan
            )
        )
    }

    fun completeOnboarding() {
        val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("has_completed_buywise_onboarding", true).apply()
        onOnboardingCompleted()
    }

    val currentCard = cards[currentPage]

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0A0814)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header: Logo & Skip Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                BuyWiseLogo(logoHeight = 36.dp, fontSize = 20)
                TextButton(onClick = { completeOnboarding() }) {
                    Text(text = "SKIP", color = Color.Gray, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Main Card Content
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF161226)),
                    shape = RoundedCornerShape(28.dp),
                    border = BorderStroke(1.dp, currentCard.accentColor.copy(alpha = 0.4f))
                ) {
                    Column(
                        modifier = Modifier.padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = currentCard.iconEmoji, fontSize = 64.sp)
                        Spacer(modifier = Modifier.height(18.dp))
                        Text(
                            text = currentCard.title,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = currentCard.subtitle,
                            fontSize = 14.sp,
                            color = Color.LightGray,
                            textAlign = TextAlign.Center,
                            lineHeight = 20.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Page Indicator Dots
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    cards.indices.forEach { index ->
                        Box(
                            modifier = Modifier
                                .size(if (index == currentPage) 10.dp else 8.dp)
                                .background(
                                    if (index == currentPage) currentCard.accentColor else Color.DarkGray,
                                    CircleShape
                                )
                        )
                    }
                }
            }

            // Bottom Navigation Buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (currentPage > 0) {
                    TextButton(onClick = { currentPage-- }) {
                        Text(text = "Back", color = Color.Gray, fontSize = 14.sp)
                    }
                } else {
                    Spacer(modifier = Modifier.width(60.dp))
                }

                Button(
                    onClick = {
                        if (currentPage < cards.size - 1) {
                            currentPage++
                        } else {
                            completeOnboarding()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = currentCard.accentColor),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.height(48.dp)
                ) {
                    Text(
                        text = if (currentPage == cards.size - 1) "START SHOPPING ➔" else "NEXT ➔",
                        color = Color.Black,
                        fontWeight = FontWeight.Black,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
