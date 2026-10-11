package com.pajonline.buywiseai.ui.screens.details

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.domain.model.StoreOffer
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink

import android.content.Context
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

private fun isWearableProduct(title: String): Boolean {
    val lower = title.lowercase().trim()

    val nonWearables = listOf(
        "foil", "paper", "wrap", "tissue", "kitchen", "phone", "iphone", "samsung",
        "macbook", "laptop", "headphone", "airpod", "earbud", "charger", "gadget",
        "tv", "appliance", "fryer", "tool", "grocery", "cleaner", "soap", "shampoo",
        "bottle", "cover", "case", "cable", "battery", "mouse", "keyboard", "hamper", "chocolates"
    )
    if (nonWearables.any { lower.contains(it) }) {
        return false
    }

    val wearables = listOf(
        "saree", "dress", "shirt", "t-shirt", "top", "jeans", "pant", "trousers",
        "kurti", "lehenga", "suit", "jacket", "coat", "hoodie", "sweater", "cardigan",
        "skirt", "outfit", "gown", "innerwear", "bra", "trunk", "pajama", "ethnic",
        "shoe", "sneaker", "boot", "sandal", "heel", "wear", "apparel", "clothing",
        "necklace", "jewellery", "jewelry", "ring", "earring", "bangle", "bracelet"
    )
    return wearables.any { lower.contains(it) }
}

@Composable
fun ProductDetailsScreen(
    offer: StoreOffer?,
    onBack: () -> Unit,
    onNavigateToVto: () -> Unit,
    onNavigateToCheckout: () -> Unit = {}
) {
    val context = LocalContext.current

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        if (offer == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("No product selected.", color = Color.White)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)) {
                    Text("Back to Search", color = Color.Black)
                }
            }
            return@Surface
        }

        val isPartner = offer.productSource == "PARTNER"
        val isWearable = isWearableProduct(offer.title)

        var isSaved by remember(offer.id) {
            val sharedPrefs = context.getSharedPreferences("buywise_saved_products", Context.MODE_PRIVATE)
            mutableStateOf(sharedPrefs.getBoolean(offer.id, false))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text(text = "Product Details", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                IconButton(onClick = {
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, "Check out ${offer.title} on ${offer.store} via BuyWise AI: ${offer.url}")
                    }
                    context.startActivity(Intent.createChooser(shareIntent, "Share Product"))
                }) {
                    Icon(Icons.Default.Share, contentDescription = "Share", tint = BuyWiseCyan)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Main Details Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box(
                            modifier = Modifier
                                .background(
                                    if (isPartner) BuyWiseNeonPink.copy(alpha = 0.25f) else BuyWiseCyan.copy(alpha = 0.2f),
                                    RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (isPartner) "🛍️ BUYWISE STORE" else offer.store,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isPartner) BuyWiseNeonPink else BuyWiseCyan
                            )
                        }

                        Box(
                            modifier = Modifier
                                .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (isPartner) "📦 PARTNER FULFILLED" else (offer.verificationStatus?.replace("_", " ")?.uppercase() ?: "VERIFIED LIVE"),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = BuyWiseEmerald
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = offer.title,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Price Section
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "₹${offer.price.toInt()}",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = BuyWiseEmerald
                        )
                        if (offer.mrp != null && offer.mrp > offer.price) {
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "₹${offer.mrp.toInt()}",
                                fontSize = 15.sp,
                                color = Color.Gray
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Ratings & Trust Scores
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF25213B), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (offer.rating != null) "${offer.rating} ★ (${offer.reviewCount ?: 0})" else "Rating unavailable",
                                fontSize = 12.sp,
                                color = BuyWiseGold
                            )
                        }

                        Box(
                            modifier = Modifier
                                .background(Color(0xFF25213B), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "Trust: ${offer.trustScore ?: 95}/100",
                                fontSize = 12.sp,
                                color = BuyWiseEmerald
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action Buttons
            if (isPartner) {
                Button(
                    onClick = onNavigateToCheckout,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "PROCEED TO BUYWISE CHECKOUT 🔒", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = {
                        try {
                            var targetUrl = offer.url.trim()
                            if (offer.store.contains("Amazon", ignoreCase = true) && !targetUrl.contains("tag=")) {
                                targetUrl = if (targetUrl.contains("?")) "$targetUrl&tag=pajonline-21" else "$targetUrl?tag=pajonline-21"
                            }
                            val validUri = Uri.parse(targetUrl)
                            val browserIntent = Intent(Intent.ACTION_VIEW, validUri).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }
                            context.startActivity(browserIntent)
                        } catch (e: Exception) {
                            e.printStackTrace()
                            val safeQuery = try { java.net.URLEncoder.encode(offer.title, "UTF-8") } catch (ex: Exception) { "product" }
                            val fallbackAmazonUrl = "https://www.amazon.in/s?k=$safeQuery&tag=pajonline-21"
                            try {
                                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(fallbackAmazonUrl)).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                context.startActivity(fallbackIntent)
                            } catch (ex: Exception) {
                                android.widget.Toast.makeText(context, "Could not open store link. Please try again.", android.widget.Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "BUY NOW ON ${offer.store.uppercase()}", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }

            // Only show Try-On option for wearable items (clothing, sarees, dresses, jewellery, shoes)
            if (isWearable) {
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedButton(
                    onClick = onNavigateToVto,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Face, contentDescription = null, tint = BuyWiseNeonPink)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "TRY ON THIS OUTFIT", color = BuyWiseNeonPink, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Active Save Product to My BuyWise button with persistence and visual feedback
            OutlinedButton(
                onClick = {
                    val sharedPrefs = context.getSharedPreferences("buywise_saved_products", Context.MODE_PRIVATE)
                    val newState = !isSaved
                    isSaved = newState
                    sharedPrefs.edit().putBoolean(offer.id, newState).apply()

                    val toastMsg = if (newState) "❤️ Saved product to My BuyWise!" else "Removed product from My BuyWise"
                    android.widget.Toast.makeText(context, toastMsg, android.widget.Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isSaved) BuyWiseNeonPink else Color.DarkGray
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSaved) BuyWiseNeonPink.copy(alpha = 0.15f) else Color.Transparent
                )
            ) {
                Icon(
                    imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = null,
                    tint = if (isSaved) BuyWiseNeonPink else Color.LightGray
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isSaved) "SAVED TO MY BUYWISE ❤️" else "SAVE PRODUCT TO MY BUYWISE",
                    color = if (isSaved) BuyWiseNeonPink else Color.LightGray,
                    fontWeight = if (isSaved) FontWeight.Bold else FontWeight.Normal
                )
            }
        }
    }
}
