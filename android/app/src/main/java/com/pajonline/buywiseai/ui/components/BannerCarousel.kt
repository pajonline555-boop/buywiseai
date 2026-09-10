package com.pajonline.buywiseai.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import kotlinx.coroutines.delay

data class BannerItem(
    val title: String,
    val subtitle: String,
    val badgeText: String,
    val gradientColors: List<Color>,
    val accentColor: Color
)

@Composable
fun BannerCarousel(
    onBannerClick: (Int) -> Unit = {}
) {
    val banners = remember {
        listOf(
            BannerItem(
                title = "AI SmartCompare Matrix",
                subtitle = "Compare real prices across 14 major Indian retailers with automated coupon deduction",
                badgeText = "14 STORES LIVE",
                gradientColors = listOf(Color(0xFF0D253F), Color(0xFF1E1B2E)),
                accentColor = BuyWiseCyan
            ),
            BannerItem(
                title = "HuggingFace AI Try-On",
                subtitle = "Virtual Try-On powered by IDM-VTON & SSIM Quality Gate. Local private photo privacy.",
                badgeText = "IDM-VTON AI",
                gradientColors = listOf(Color(0xFF3B122D), Color(0xFF1E1B2E)),
                accentColor = BuyWiseNeonPink
            ),
            BannerItem(
                title = "Coupon Truth Engine",
                subtitle = "Only 100% verified coupons guaranteed active today. Zero fake promotional codes.",
                badgeText = "VERIFIED TODAY",
                gradientColors = listOf(Color(0xFF0F382C), Color(0xFF1E1B2E)),
                accentColor = BuyWiseEmerald
            ),
            BannerItem(
                title = "BuyWise Direct Partners",
                subtitle = "Shop verified direct partner inventory with fast shipping & exclusive pricing",
                badgeText = "PARTNER STORE",
                gradientColors = listOf(Color(0xFF382F0F), Color(0xFF1E1B2E)),
                accentColor = BuyWiseGold
            )
        )
    }

    var currentIndex by remember { mutableIntStateOf(0) }

    // Auto-advance banner carousel every 4 seconds
    LaunchedEffect(Unit) {
        while (true) {
            delay(4000)
            currentIndex = (currentIndex + 1) % banners.size
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .clickable { onBannerClick(currentIndex) },
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            AnimatedContent(
                targetState = currentIndex,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "BannerTransition"
            ) { index ->
                val banner = banners[index]
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .background(Brush.horizontalGradient(banner.gradientColors))
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(banner.accentColor.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = banner.badgeText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = banner.accentColor
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = banner.title,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = banner.subtitle,
                            fontSize = 12.sp,
                            color = Color.LightGray,
                            maxLines = 2
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Carousel Indicators
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            banners.indices.forEach { index ->
                val isSelected = index == currentIndex
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(if (isSelected) 20.dp else 8.dp, 8.dp)
                        .background(
                            color = if (isSelected) BuyWiseCyan else Color.DarkGray,
                            shape = CircleShape
                        )
                        .clickable { currentIndex = index }
                )
            }
        }
    }
}
