package com.pajonline.buywiseai.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.delay

data class PosterBannerItem(
    val title: String,
    val headline: String,
    val priceText: String,
    val dropTag: String,
    val badgeText: String,
    val storeLogo: String,
    val actionText: String,
    val gradientColors: List<Color>,
    val accentColor: Color
)

@Composable
fun BannerCarousel(
    onBannerClick: (String) -> Unit = {}
) {
    val banners = remember {
        listOf(
            PosterBannerItem(
                title = "AMAZON INDIA VERIFIED",
                headline = "iPhone 17 (256 GB)",
                priceText = "₹82,900",
                dropTag = "▲ -8.5% Price Drop",
                badgeText = "BEST PRICE TODAY",
                storeLogo = "🛒",
                actionText = "View Price Chart ➔",
                gradientColors = listOf(Color(0xFF1F1235), Color(0xFF0C192E)),
                accentColor = BuyWiseCyan
            ),
            PosterBannerItem(
                title = "GEN-G STORE DIRECT",
                headline = "Royal Kanjivaram Silk Saree",
                priceText = "₹4,999",
                dropTag = "🔥 0% Commission Deal",
                badgeText = "DIRECT FACTORY",
                storeLogo = "👗",
                actionText = "Try In 3D Room ➔",
                gradientColors = listOf(Color(0xFF380C26), Color(0xFF140B22)),
                accentColor = BuyWiseNeonPink
            ),
            PosterBannerItem(
                title = "FLIPKART SUPERDEAL",
                headline = "Samsung Galaxy S24 Ultra",
                priceText = "₹1,19,999",
                dropTag = "💳 ₹1,500 Bank Cashback",
                badgeText = "SUPERCOIN DEAL",
                storeLogo = "⚡",
                actionText = "Compare 14 Stores ➔",
                gradientColors = listOf(Color(0xFF0F3223), Color(0xFF0C1428)),
                accentColor = BuyWiseEmerald
            ),
            PosterBannerItem(
                title = "AI VIRTUAL TRIAL ROOM",
                headline = "Instant Outfit Try-On Engine",
                priceText = "100% Free",
                dropTag = "✨ SSIM Quality Gate Verified",
                badgeText = "IDM-VTON AI",
                storeLogo = "📸",
                actionText = "Upload Photo ➔",
                gradientColors = listOf(Color(0xFF382F0F), Color(0xFF1C0D2B)),
                accentColor = BuyWiseGold
            )
        )
    }

    var currentIndex by remember { mutableIntStateOf(0) }

    // Auto-advance banner slides every 3.5 seconds
    LaunchedEffect(Unit) {
        while (true) {
            delay(3500)
            currentIndex = (currentIndex + 1) % banners.size
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(154.dp)
                .clickable { onBannerClick(banners[currentIndex].headline) },
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, banners[currentIndex].accentColor.copy(alpha = 0.5f))
        ) {
            AnimatedContent(
                targetState = currentIndex,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "3DPosterTransition"
            ) { index ->
                val banner = banners[index]
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.horizontalGradient(banner.gradientColors))
                        .padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Top Header Pill & Store Emblem
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(banner.accentColor.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                                    .border(1.dp, banner.accentColor.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "${banner.storeLogo} ${banner.title}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = banner.accentColor,
                                    letterSpacing = 0.5.sp
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .background(BuyWiseGold.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = banner.badgeText,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                    color = BuyWiseGold
                                )
                            }
                        }

                        // Middle Content Title & Price Tag
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = banner.headline,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = banner.dropTag,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BuyWiseEmerald
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = banner.priceText,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Text(
                                    text = "LIVE PRICE",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Gray
                                )
                            }
                        }

                        // Bottom Action CTA Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "🔥 3D Poster Banner • Real-Time Deal Tracker",
                                fontSize = 10.sp,
                                color = Color.LightGray
                            )

                            Box(
                                modifier = Modifier
                                    .background(banner.accentColor, RoundedCornerShape(10.dp))
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = banner.actionText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.Black
                                )
                            }
                        }
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
                        .size(if (isSelected) 22.dp else 8.dp, 6.dp)
                        .background(
                            color = if (isSelected) BuyWiseCyan else Color.Gray.copy(alpha = 0.4f),
                            shape = CircleShape
                        )
                        .clickable { currentIndex = index }
                )
            }
        }
    }
}
