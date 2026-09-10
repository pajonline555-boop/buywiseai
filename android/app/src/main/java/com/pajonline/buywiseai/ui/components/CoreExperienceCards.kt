package com.pajonline.buywiseai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

@Composable
fun CoreExperienceCards(
    onCompareClick: () -> Unit = {},
    onTryOnClick: () -> Unit = {},
    onCouponsClick: () -> Unit = {}
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Card 1: Multi-Store Price Engine
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.35f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(BuyWiseCyan.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                            .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "⚖️", fontSize = 22.sp)
                    }

                    Box(
                        modifier = Modifier
                            .background(BuyWiseCyan.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "COMPARE IT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseCyan,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Multi-Store Price Engine",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Search & compare live prices across Amazon, Flipkart, Meesho, Myntra, Nykaa, AJIO, Tata CLiQ, Etsy, eBay, and 2,500+ stores.",
                    fontSize = 13.sp,
                    color = Color.LightGray,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BuyWiseCyan.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        .clickable { onCompareClick() }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Compare Stores Now ➔",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = BuyWiseCyan
                    )
                }
            }
        }

        // Card 2: AI Virtual Trial Room
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseNeonPink.copy(alpha = 0.35f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(BuyWiseNeonPink.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                            .border(1.dp, BuyWiseNeonPink.copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "👗✨", fontSize = 20.sp)
                    }

                    Box(
                        modifier = Modifier
                            .background(BuyWiseNeonPink.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "TRY IT ON",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseNeonPink,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "AI Virtual Trial Room",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Upload your photo or paste product links from Myntra, Amazon, Nykaa or Etsy to see yourself wearing sarees, dresses, or innerwear before buying.",
                    fontSize = 13.sp,
                    color = Color.LightGray,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(BuyWiseNeonPink.copy(alpha = 0.25f), BuyWisePurple.copy(alpha = 0.25f))
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .border(1.dp, BuyWiseNeonPink.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .clickable { onTryOnClick() }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Open AI Trial Room ➔",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = BuyWiseNeonPink
                    )
                }
            }
        }

        // Card 3: Real Effective Price & Coupons
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseEmerald.copy(alpha = 0.35f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(BuyWiseEmerald.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                            .border(1.dp, BuyWiseEmerald.copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🎟️💰", fontSize = 20.sp)
                    }

                    Box(
                        modifier = Modifier
                            .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "SAVE & BUY",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseEmerald,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Real Effective Price & Coupons",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Get 100% verified working coupons, stackable promo codes, and real effective price calculation (`Listed Price - Coupon = Net Savings`) before checkout.",
                    fontSize = 13.sp,
                    color = Color.LightGray,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(BuyWiseEmerald, BuyWiseCyan)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .clickable { onCouponsClick() }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Find Verified Coupons ➔",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF070510)
                    )
                }
            }
        }
    }
}
