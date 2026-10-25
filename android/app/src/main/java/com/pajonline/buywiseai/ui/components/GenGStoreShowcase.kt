package com.pajonline.buywiseai.ui.components

import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.platform.LocalContext
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
    val imageUrl: String,
    val productUrl: String = "",
    val slug: String = ""
)

@Composable
fun GenGStoreShowcase(
    onViewAllClick: () -> Unit = {},
    onTryOnClick: (PartnerProductSlide) -> Unit = {},
    onBuyNowClick: (PartnerProductSlide) -> Unit = {},
    onShareClick: (PartnerProductSlide) -> Unit = {}
) {
    // Baseline Verified Product Slides Array
    val defaultSlides = remember {
        listOf(
            PartnerProductSlide(
                id = "prod_partner_meesho_trendy_partywear_1",
                title = "Trendy Partywear Women Dress",
                description = "Meesho Verified Trending Outfit: Stylish partywear sleeveless flared floral midi dress by BIG 20shope. Premium georgette blend fabric.",
                retailer = "MEESHO / BIG 20SHOPE",
                rating = "4.9",
                reviewCount = "3840",
                sellingPrice = "₹345",
                mrp = "₹599",
                discountPercent = "42% OFF SPECIAL DEAL",
                imageUrl = "https://images.meesho.com/images/products/466292667/3cyxt_1024.jpg",
                productUrl = "https://www.meesho.com/s/p/7pm9q3",
                slug = "trendy-partywear-women-dress"
            ),
            PartnerProductSlide(
                id = "prod_partner_kamarbandh_1",
                title = "Etietnic Gujarati Traditional Embroidered Kamarbandh",
                description = "Verified Amazon India product: Etietnic Gujarati Traditional Embroidered Kamarbandh. Authentic quality and fast delivery guaranteed across India.",
                retailer = "BUYWISE VERIFIED PARTNER NETWORK",
                rating = "4.9",
                reviewCount = "24",
                sellingPrice = "₹499",
                mrp = "₹999",
                discountPercent = "50% OFF SPECIAL DEAL",
                imageUrl = "https://m.media-amazon.com/images/I/71gxwje9wqL._SL800_.jpg",
                productUrl = "https://www.amazon.in/s?k=Etietnic+Gujarati+Traditional+Embroidered+Kamarbandh",
                slug = "etietnic-gujarati-traditional-embroidered-kamarbandh"
            ),
            PartnerProductSlide(
                id = "prod_partner_flipkart_s24_1",
                title = "Samsung Galaxy S24 5G (Onyx Black, 256 GB)",
                description = "Flipkart Big Billion Deal: 8 GB RAM, Galaxy AI Features with Circle to Search, 50MP Pro-Grade Camera.",
                retailer = "FLIPKART",
                rating = "4.6",
                reviewCount = "2890",
                sellingPrice = "₹64,999",
                mrp = "₹79,999",
                discountPercent = "18% OFF SPECIAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
                productUrl = "https://www.flipkart.com/samsung-galaxy-s24-5g/p/itm12345",
                slug = "samsung-s24-ultra"
            ),
            PartnerProductSlide(
                id = "prod_partner_meesho_georgette_1",
                title = "Meesho Trending Heavy Georgette Sequence Saree with Blouse",
                description = "Meesho Verified Super Deal: Premium Bollywood style embroidered sequence work Georgette saree.",
                retailer = "MEESHO",
                rating = "4.8",
                reviewCount = "8940",
                sellingPrice = "₹899",
                mrp = "₹2,499",
                discountPercent = "64% OFF SPECIAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
                productUrl = "https://www.meesho.com/s/p/trending-georgette-saree-1234",
                slug = "biba-anarkali-suit"
            ),
            PartnerProductSlide(
                id = "prod_partner_iphone16_1",
                title = "Apple iPhone 16 (128 GB) - Ultramarine",
                description = "Amazon India Festival Choice: 6.1-inch Super Retina XDR OLED with A18 Bionic Chip, Camera Control, 48MP Fusion Camera & ₹12,000 Instant Bank Offer.",
                retailer = "AMAZON INDIA",
                rating = "4.7",
                reviewCount = "28400",
                sellingPrice = "₹67,900",
                mrp = "₹79,900",
                discountPercent = "15% OFF FESTIVAL DEAL",
                imageUrl = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
                productUrl = "https://www.amazon.in/s?k=Apple+iPhone+16+128GB",
                slug = "iphone-16"
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
                imageUrl = "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
                productUrl = "https://www.amazon.in/s?k=Levis+511+Slim+Jeans",
                slug = "levis-slim-jeans"
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
                imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                productUrl = "https://www.amazon.in/s?k=Sony+WH-1000XM5",
                slug = "sony-xm5"
            )
        )
    }

    var dynamicSlides by remember { mutableStateOf<List<PartnerProductSlide>>(defaultSlides) }

    // Dynamic Firestore Sync: real-time updates for newly onboarded partner products
    LaunchedEffect(Unit) {
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            db.collection("partner_products")
                .get()
                .addOnSuccessListener { snap ->
                    if (!snap.isEmpty) {
                        val fetchedList = mutableListOf<PartnerProductSlide>()
                        for (doc in snap.documents) {
                            val title = doc.getString("title") ?: continue
                            val status = doc.getString("status") ?: "LIVE"
                            if (status != "LIVE" && status != "ACTIVE") continue
                            
                            val id = doc.id
                            val desc = doc.getString("description") ?: "Verified BuyWise Partner Deal"
                            val brand = doc.getString("brand") ?: doc.getString("partnerName") ?: "BUYWISE PARTNER"
                            val img = doc.getString("primaryImage") ?: continue
                            if (img.isBlank()) continue
                            
                            val sellingPriceNum = doc.getLong("sellingPrice") ?: 499L
                            val mrpNum = doc.getLong("mrp") ?: (sellingPriceNum * 14 / 10)
                            val discountPct = if (mrpNum > sellingPriceNum) {
                                "${((mrpNum - sellingPriceNum) * 100 / mrpNum)}% OFF SPECIAL DEAL"
                            } else "SPECIAL DEAL"
                            val prodUrl = doc.getString("productUrl") ?: ""
                            val slug = doc.getString("slug") ?: id
                            
                            fetchedList.add(
                                PartnerProductSlide(
                                    id = id,
                                    title = title,
                                    description = desc,
                                    retailer = brand.uppercase(),
                                    rating = "4.9",
                                    reviewCount = "120",
                                    sellingPrice = "₹$sellingPriceNum",
                                    mrp = "₹$mrpNum",
                                    discountPercent = discountPct,
                                    imageUrl = img,
                                    productUrl = prodUrl,
                                    slug = slug
                                )
                            )
                        }
                        if (fetchedList.isNotEmpty()) {
                            val existingIds = fetchedList.map { it.id }.toSet()
                            val combined = fetchedList + defaultSlides.filter { it.id !in existingIds }
                            dynamicSlides = combined.sortedByDescending {
                                it.id.contains("trendy_partywear") || it.title.contains("Partywear", ignoreCase = true)
                            }
                        }
                    }
                }
        } catch (_: Throwable) {}
    }

    val items = dynamicSlides
    var currentIndex by remember { mutableStateOf(0) }

    // Auto-slide interval: 4 seconds (comfortable reading pace)
    LaunchedEffect(key1 = items.size) {
        while (true) {
            delay(4000L) // 4 second interval
            currentIndex = (currentIndex + 1) % items.size
        }
    }

    val currentProd = items[currentIndex]
    val context = LocalContext.current

    val openProductPage = {
        val pageUrl = "https://buywiseai.pajonline.co.in/product/${currentProd.slug.ifEmpty { currentProd.id }}"
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(pageUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val rawUrl = currentProd.productUrl.ifEmpty { "https://www.amazon.in/s?k=${Uri.encode(currentProd.title)}" }
            val affiliateUrl = if (rawUrl.contains("tag=")) rawUrl
                else if (rawUrl.contains("?")) "$rawUrl&tag=pajonline-21&ascsubtag=bw_gen_g_store"
                else "$rawUrl?tag=pajonline-21&ascsubtag=bw_gen_g_store"
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(affiliateUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (ex: Exception) {
                onBuyNowClick(currentProd)
            }
        }
    }

    val handleBuyNow: () -> Unit = {
        val targetUrl = if (currentProd.productUrl.isNotBlank() && currentProd.productUrl.startsWith("http")) {
            currentProd.productUrl
        } else {
            val encodedTitle = Uri.encode(currentProd.title)
            val storeLower = currentProd.retailer.lowercase()
            when {
                storeLower.contains("flipkart") -> "https://www.flipkart.com/search?q=$encodedTitle"
                storeLower.contains("myntra") -> "https://www.myntra.com/$encodedTitle"
                storeLower.contains("meesho") -> "https://www.meesho.com/search?q=$encodedTitle"
                storeLower.contains("ajio") -> "https://www.ajio.com/search/?text=$encodedTitle"
                else -> "https://www.amazon.in/s?k=$encodedTitle"
            }
        }
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            onBuyNowClick(currentProd)
        }
    }

    val handleShare: () -> Unit = {
        val shareUrl = "https://buywiseai.pajonline.co.in/product/${currentProd.slug.ifEmpty { currentProd.id }}"
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            putExtra(Intent.EXTRA_TEXT, "Check out ${currentProd.title} on BuyWise AI! Compare prices & try on: $shareUrl")
            type = "text/plain"
        }
        context.startActivity(Intent.createChooser(sendIntent, "Share Product via"))
        onShareClick(currentProd)
    }

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
                            text = com.pajonline.buywiseai.data.i18n.tr(col.name),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = com.pajonline.buywiseai.data.i18n.tr(col.badge),
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
                        .height(260.dp)
                        .background(Color(0xFF080612))
                        .clickable { openProductPage() }
                ) {
                    AsyncImage(
                        model = currentProd.imageUrl,
                        contentDescription = currentProd.title,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(260.dp)
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
                        maxLines = 2,
                        modifier = Modifier.clickable { openProductPage() }
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

                    // Multi-Size Auto Try-On Options (Petite S, Regular M, Dusky L, Curvy XXL)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF0F0B1E), RoundedCornerShape(10.dp))
                            .border(1.dp, BuyWiseGold.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "👗 Auto Try-On Sizes:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = BuyWiseGold
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("S", "M", "L", "XXL").forEach { sizeLabel ->
                                Box(
                                    modifier = Modifier
                                        .background(
                                            brush = Brush.horizontalGradient(
                                                colors = listOf(Color(0xFF261D42), Color(0xFF191330))
                                            ),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                                        .clickable {
                                            com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.targetSize = sizeLabel
                                            onTryOnClick(currentProd)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = sizeLabel,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Action Buttons: AI Try On + Buy Now + Share
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
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
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Box(
                            modifier = Modifier
                                .weight(1.2f)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(BuyWiseEmerald, BuyWiseCyan)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable { handleBuyNow() }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "🛍️ View Now",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF070510)
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(Color(0xFF1E1B2E), RoundedCornerShape(12.dp))
                                .border(1.dp, BuyWiseCyan.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                                .clickable { handleShare() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "🔗",
                                fontSize = 16.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Official YouTube Shorts Channel Link ONLY
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                brush = Brush.horizontalGradient(
                                    colors = listOf(Color(0xFF2C040E), Color(0xFF1B0720))
                                )
                            )
                            .border(1.dp, Color(0xFFFF0055).copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .clickable {
                                val ytShortsUrl = "https://www.youtube.com/@BUYWISEAI-u8n/shorts"
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ytShortsUrl)).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(Color(0xFFFF0000), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("▶", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = "Official YouTube Shorts Channel",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "@BUYWISEAI-u8n • Watch product styling reels",
                                        fontSize = 9.5.sp,
                                        color = Color(0xFFFF4D79)
                                    )
                                }
                            }
                            Text(
                                text = "Watch Shorts ↗",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFFFF4D79)
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
                        text = "SLIDE 0${currentIndex + 1} / 0${items.size} • 4s AUTOPLAY",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = BuyWiseEmerald
                    )
                }
            }
        }
    }
}
