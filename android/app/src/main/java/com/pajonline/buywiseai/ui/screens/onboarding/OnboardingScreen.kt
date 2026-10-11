package com.pajonline.buywiseai.ui.screens.onboarding

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.R
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import kotlinx.coroutines.launch

data class PosterItemData(
    val drawableRes: Int,
    val title: String,
    val badge: String,
    val accentColor: Color
)

@Composable
fun OnboardingScreen(
    onOnboardingCompleted: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val posters = remember {
        listOf(
            PosterItemData(R.drawable.poster_1, "BuyWise AI - Smart Shopping Companion", "🛍️ WELCOME TO BUYWISE", BuyWiseCyan),
            PosterItemData(R.drawable.poster_2, "Compare 14 Retailer Prices Live", "⚡ REAL-TIME PRICE COMPARISON", BuyWiseEmerald),
            PosterItemData(R.drawable.poster_3, "AI Virtual Trial Room - Try Before You Buy", "✨ AI VIRTUAL TRY-ON", Color(0xFFFF007F)),
            PosterItemData(R.drawable.poster_4, "Multi-Lingual Voice & Photo Search", "🎙️ VOICE & CAMERA SEARCH", BuyWiseGold),
            PosterItemData(R.drawable.poster_5, "Price Alerts & Price History Graphs", "🔔 PRICE DROP NOTIFICATIONS", BuyWiseCyan),
            PosterItemData(R.drawable.poster_6, "Verified Merchants & Fraud Protection", "🛡️ SHOP WITH CONFIDENCE", BuyWiseEmerald)
        )
    }

    val pagerState = rememberPagerState(pageCount = { posters.size })

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
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Bar: BuyWise Logo + SKIP button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                BuyWiseLogo(logoHeight = 32.dp, fontSize = 18)

                Box(
                    modifier = Modifier
                        .background(Color(0xFF1E1B2E), RoundedCornerShape(16.dp))
                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .clickable { completeOnboarding() }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "SKIP ➔",
                        color = BuyWiseCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            // Swipeable Poster Image Viewport
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(vertical = 8.dp)
            ) { page ->
                val poster = posters[page]
                Card(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF100C22)),
                    shape = RoundedCornerShape(24.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, poster.accentColor.copy(alpha = 0.6f))
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        Image(
                            painter = painterResource(id = poster.drawableRes),
                            contentDescription = poster.title,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(RoundedCornerShape(24.dp)),
                            contentScale = ContentScale.Fit
                        )

                        // Subtle Top Badge Overlay
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(12.dp)
                                .background(Color(0xCC0C0A14), RoundedCornerShape(12.dp))
                                .border(1.dp, poster.accentColor.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "${page + 1}/6 • ${poster.badge}",
                                color = poster.accentColor,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }
            }

            // Bottom Navigation Controls: Dots + Back / Next Buttons
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Page Indicator Dots
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 12.dp)
                ) {
                    posters.indices.forEach { index ->
                        val isSelected = index == pagerState.currentPage
                        val activeColor = posters[pagerState.currentPage].accentColor
                        Box(
                            modifier = Modifier
                                .height(8.dp)
                                .width(if (isSelected) 24.dp else 8.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) activeColor else Color(0xFF332D48))
                        )
                    }
                }

                // Action Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
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
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.width(60.dp))
                    }

                    val currentPoster = posters[pagerState.currentPage]
                    Button(
                        onClick = {
                            if (pagerState.currentPage < posters.size - 1) {
                                scope.launch {
                                    pagerState.animateScrollToPage(pagerState.currentPage + 1)
                                }
                            } else {
                                completeOnboarding()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = currentPoster.accentColor),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.height(46.dp)
                    ) {
                        Text(
                            text = if (pagerState.currentPage == posters.size - 1) "GET STARTED ➔" else "NEXT ➔",
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
