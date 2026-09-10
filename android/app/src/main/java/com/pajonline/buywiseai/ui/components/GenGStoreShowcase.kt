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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.delay

data class PartnerProductSlide(
    val id: String,
    val title: String,
    val description: String,
    val retailer: String,
    val rating: String,
    val reviewCount: String,
    val sellingPrice: String,
    val mrp: String,
    val discountPercent: String,
    val imageUrl: String
)

@Composable
fun GenGStoreShowcase(
    onViewAllClick: () -> Unit = {},
    onTryOnClick: (PartnerProductSlide) -> Unit = {},
    onBuyNowClick: (PartnerProductSlide) -> Unit = {}
) {
    // Exact Product Data Array from web/src/lib/partners/partnerService.ts
    val items = remember {
        listOf(
            PartnerProductSlide(
                id = "prod_partner_louiscraft_panties_1",
                title = "Louis Craft Women's Cotton Printed Panties (Pack of 5)",
                description = "Verified Amazon India Best Seller: 100% Super Soft Combed Cotton Panties with Anti-Bacterial Hipster Fit.",
                retailer = "AMAZON INDIA",
                rating = "4.9",
                reviewCount = "1420",
                sellingPrice = "₹289",
                mrp = "₹499",
                discountPercent = "42% OFF SPECIAL DEAL",
                imageUrl = "https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg"
            ),
            PartnerProductSlide(
                id = "prod_partner_zivame_bra_1",
                title = "Zivame Padded Wirefree Seamless T-Shirt Bra",
                description = "Amazon India Best Seller: Super Soft Polyamide Microfiber Stretch with 3/4th Coverage Seamless Moulded Padded Cups.",
                retailer = "AMAZON INDIA",
                rating = "4.8",
                reviewCount = "3890",
                sellingPrice = "₹999",
                mrp = "₹1,999",
                discountPercent = "50% OFF SPECIAL DEAL",
                imageUrl = "https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg"
            ),
            PartnerProductSlide(
                id = "prod_partner_jockey_trunk_1",
                title = "Jockey Men's Super Combed Cotton Trunk (Pack of 3)",
                description = "Amazon India Top Rated: 100% Super Combed Cotton Ribbed Fabric with Ultra-Soft Microfiber Elastic Waistband.",
                retailer = "AMAZON INDIA",
                rating = "4.9",
                reviewCount = "6120",
                sellingPrice = "₹899",
                mrp = "₹1,199",
                discountPercent = "25% OFF SPECIAL DEAL",
                imageUrl = "https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg"
            ),
            PartnerProductSlide(
                id = "prod_partner_iphone17_1",
                title = "Apple iPhone 17 (256 GB) - Teal / Titanium",
                description = "Amazon India Choice: 6.3-inch Super Retina XDR OLED 120Hz ProMotion with A18 Pro Bionic Chip and 48MP Dual Fusion Camera.",
                retailer = "AMAZON INDIA",
                rating = "4.9",
                reviewCount = "3420",
                sellingPrice = "₹82,900",
                mrp = "₹89,900",
                discountPercent = "8% OFF SPECIAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"
            ),
            PartnerProductSlide(
                id = "prod_partner_levis_jeans_1",
                title = "Levi's Men's 511 Slim Fit Stretchable Denim Jeans",
                description = "Amazon India Fashion Bestseller: 99% Premium Cotton, 1% Elastane Stretch with Slim Fit Narrow Leg Opening.",
                retailer = "AMAZON INDIA",
                rating = "4.7",
                reviewCount = "5210",
                sellingPrice = "₹1,899",
                mrp = "₹3,599",
                discountPercent = "47% OFF SPECIAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"
            ),
            PartnerProductSlide(
                id = "prod_partner_sony_xm5_1",
                title = "Sony WH-1000XM5 Wireless ANC Headphones",
                description = "Amazon India Audio Deal: Industry Leading Noise Cancellation with Dual Processor V1 & 30-Hour Battery Life.",
                retailer = "AMAZON INDIA",
                rating = "4.8",
                reviewCount = "4120",
                sellingPrice = "₹24,990",
                mrp = "₹34,990",
                discountPercent = "28% OFF SPECIAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
            )
        )
    }

    var currentIndex by remember { mutableStateOf(0) }

    // STRICT OWNER REQUIREMENT: Auto-slide interval MUST be 1000ms (1 second)
    LaunchedEffect(key1 = items.size) {
        while (true) {
            delay(1000L) // 1 second interval
            currentIndex = (currentIndex + 1) % items.size
        }
    }

    val currentProd = items[currentIndex]
    val collectionsList = remember { com.pajonline.buywiseai.data.repository.PaymentRepository.getMerchandisingCollections() }

    Column(modifier = Modifier.fillMaxWidth()) {
        // Merchandising Collections Chips Row
        androidx.compose.foundation.lazy.LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(collectionsList) { col ->
                Box(
                    modifier = Modifier
                        .background(Color(0xFF19142E), RoundedCornerShape(12.dp))
                        .border(1.dp, BuyWiseGold.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = col.name,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = col.badge,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseGold
                        )
                    }
                }
            }
        }

        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Box(
                    modifier = Modifier
                        .background(BuyWiseEmerald.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                        .border(1.dp, BuyWiseEmerald.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "⚡", fontSize = 10.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "EXCLUSIVE GEN-G STORE SHOWCASE",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseEmerald
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Trending in ",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Gen-G Store 🛍️",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = BuyWiseEmerald
                    )
                }
            }

            // Prev / Next Controls
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color(0xFF1E1B2E), CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                        .clickable {
                            currentIndex = (currentIndex - 1 + items.size) % items.size
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "◀", fontSize = 11.sp, color = Color.White)
                }

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color(0xFF1E1B2E), CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                        .clickable {
                            currentIndex = (currentIndex + 1) % items.size
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "▶", fontSize = 11.sp, color = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Main Showcase Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseEmerald.copy(alpha = 0.4f))
        ) {
            Column {
                // Product Picture & Badges using Coil AsyncImage
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(210.dp)
                        .background(Color(0xFF080612))
                ) {
                    AsyncImage(
                        model = currentProd.imageUrl,
                        contentDescription = currentProd.title,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(210.dp)
                            .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    )

                    // Gen-G Partner Badge Top Left
                    Box(
                        modifier = Modifier
                            .padding(12.dp)
                            .align(Alignment.TopStart)
                            .background(Color(0xCC05030A), RoundedCornerShape(12.dp))
                            .border(1.dp, BuyWiseEmerald.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "⚡", fontSize = 11.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Gen-G Store Partner",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = BuyWiseEmerald
                            )
                        }
                    }

                    // Discount Tag Bottom Left
                    Box(
                        modifier = Modifier
                            .padding(12.dp)
                            .align(Alignment.BottomStart)
                            .background(BuyWiseNeonPink.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .border(1.dp, BuyWiseNeonPink.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = currentProd.discountPercent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseNeonPink
                        )
                    }
                }

                // Details Area
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = currentProd.retailer,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseCyan
                        )

                        Box(
                            modifier = Modifier
                                .background(BuyWiseGold.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                .border(1.dp, BuyWiseGold.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "⭐ ${currentProd.rating} (${currentProd.reviewCount})",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = BuyWiseGold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = currentProd.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        maxLines = 2
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = currentProd.description,
                        fontSize = 12.sp,
                        color = Color.Gray,
                        maxLines = 2
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Price Block
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0C0A14), RoundedCornerShape(14.dp))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(14.dp))
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Gen-G Store Price",
                                    fontSize = 10.sp,
                                    color = Color.Gray
                                )
                                Row(verticalAlignment = Alignment.Bottom) {
                                    Text(
                                        text = currentProd.sellingPrice,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.Black,
                                        color = BuyWiseEmerald
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = currentProd.mrp,
                                        fontSize = 12.sp,
                                        color = Color.Gray,
                                        textDecoration = TextDecoration.LineThrough
                                    )
                                }
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "✔ Free Express Delivery",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BuyWiseEmerald
                                )
                                Text(
                                    text = "Direct Partner Fulfillment",
                                    fontSize = 9.sp,
                                    color = Color.Gray
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Action Buttons: AI Try On + Buy Now
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(BuyWiseNeonPink.copy(alpha = 0.3f), BuyWisePurple.copy(alpha = 0.3f))
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .border(1.dp, BuyWiseNeonPink.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                                .clickable { onTryOnClick(currentProd) }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "✨ AI Try On",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(BuyWiseEmerald, BuyWiseCyan)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable { onBuyNowClick(currentProd) }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "🛍️ Buy Now",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF070510)
                            )
                        }
                    }
                }

                // Slide Progress Indicator Bar (6 Indicators matching 6 slides)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF080612))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        items.indices.forEach { index ->
                            Box(
                                modifier = Modifier
                                    .width(if (index == currentIndex) 22.dp else 6.dp)
                                    .height(6.dp)
                                    .background(
                                        if (index == currentIndex) BuyWiseEmerald else Color.Gray.copy(alpha = 0.4f),
                                        CircleShape
                                    )
                            )
                        }
                    }

                    Text(
                        text = "SLIDE 0${currentIndex + 1} / 0${items.size} • 1s AUTOPLAY",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = BuyWiseEmerald
                    )
                }
            }
        }
    }
}
