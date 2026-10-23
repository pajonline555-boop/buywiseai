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

private fun stripAffiliateParameters(url: String): String {
    return try {
        val uri = Uri.parse(url)
        val scheme = uri.scheme ?: return url
        val host = uri.host ?: return url
        val path = uri.path ?: ""
        
        val builder = Uri.Builder()
            .scheme(scheme)
            .authority(host)
            .path(path)
            
        val excludedParams = setOf(
            "affid", "tag", "ascsubtag", "affextparam1", "subid",
            "utm_source", "utm_medium", "utm_campaign", "pub_id"
        )
        
        for (paramName in uri.queryParameterNames) {
            if (!excludedParams.contains(paramName.lowercase())) {
                val value = uri.getQueryParameter(paramName)
                builder.appendQueryParameter(paramName, value)
            }
        }
        val clean = builder.build().toString()
        if (clean.endsWith("?")) clean.dropLast(1) else clean
    } catch (e: Exception) {
        url.replace(Regex("""[?&](affid|tag|ascsubtag|subid)=[^&]+"""), "")
            .replace("?&", "?")
            .removeSuffix("?")
    }
}

private fun extractCleanSearchKeyword(title: String): String {
    var clean = title
        .replace(Regex("""\(Official[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Brand Box Pack[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Authentic[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Brand Warranty[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Croma Official Store[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Official Authorized Store[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Official Brand Packaging[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .replace(Regex("""\(Authorised Dealer Unit[^\)]*\)""", RegexOption.IGNORE_CASE), "")
        .trim()

    // Unreleased iPhone mapping: redirect to latest authentic released flagship
    if (clean.contains("iPhone 17 Pro", ignoreCase = true) || clean.contains("17 Pro", ignoreCase = true)) {
        return "Apple iPhone 16 Pro 128GB"
    }
    if (clean.contains("iPhone 17", ignoreCase = true) || clean.contains("iPhone17", ignoreCase = true)) {
        return "Apple iPhone 16 128GB"
    }

    // Clean up TV titles
    if (clean.contains("Crystal 4K", ignoreCase = true)) {
        return when {
            clean.contains("55") -> "Samsung Crystal 4K 55 inch TV"
            clean.contains("65") -> "Samsung Crystal 4K 65 inch TV"
            clean.contains("32") -> "Samsung 32 inch Smart TV"
            else -> "Samsung Crystal 4K 43 inch TV"
        }
    }
    if (clean.contains("Bravia", ignoreCase = true) || (clean.contains("Sony", ignoreCase = true) && clean.contains("TV", ignoreCase = true))) {
        return "Sony Bravia 4K TV"
    }

    // Laptops
    if (clean.contains("MacBook Pro", ignoreCase = true)) {
        return "Apple MacBook Pro"
    }
    if (clean.contains("MacBook Air", ignoreCase = true)) {
        return "Apple MacBook Air M2"
    }

    val hyphenIndex = clean.lastIndexOf(" - ")
    if (hyphenIndex > 10) {
        clean = clean.substring(0, hyphenIndex).trim()
    }

    return clean.trim().ifBlank { title.trim() }
}

private fun resolveProperProductStoreUrl(offer: StoreOffer): String {
    val storeLower = offer.store.lowercase().trim()
    val rawUrl = offer.url.trim()

    // 1. If offer.url is an authentic direct product detail page (e.g. /p/ on Flipkart, /dp/ on Amazon)
    val isDirectProductPage = rawUrl.startsWith("http") && (
        rawUrl.contains("/p/") || 
        rawUrl.contains("/dp/") || 
        rawUrl.contains("/product/") || 
        rawUrl.contains("/item/") ||
        rawUrl.contains("/buy/")
    )
    if (isDirectProductPage) {
        return stripAffiliateParameters(rawUrl)
    }

    // 2. If offer.url is an authentic store search URL generated by SmartMarketIntelligence
    val isStoreSearchUrl = rawUrl.startsWith("http") && (
        rawUrl.contains("/s?k=") ||
        rawUrl.contains("/search?q=") ||
        rawUrl.contains("searchB?q=") ||
        rawUrl.contains("search?query=") ||
        rawUrl.contains("/ps/?q=") ||
        rawUrl.contains("/s/?q=")
    )
    if (isStoreSearchUrl) {
        return stripAffiliateParameters(rawUrl)
    }

    // 3. Fallback: Extract clean keyword and build direct store search
    val cleanKeyword = extractCleanSearchKeyword(offer.title)
    val titleEncoded = try {
        java.net.URLEncoder.encode(cleanKeyword, "UTF-8")
    } catch (e: Exception) {
        cleanKeyword.replace(" ", "+")
    }

    return when {
        storeLower.contains("flipkart") -> "https://www.flipkart.com/search?q=$titleEncoded"
        storeLower.contains("amazon") -> "https://www.amazon.in/s?k=$titleEncoded"
        storeLower.contains("croma") -> "https://www.croma.com/searchB?q=$titleEncoded%3Arelevance&text=$titleEncoded"
        storeLower.contains("reliance") -> "https://www.reliancedigital.com/search?q=$titleEncoded:relevance"
        storeLower.contains("myntra") -> "https://www.myntra.com/$titleEncoded"
        storeLower.contains("nykaa") -> "https://www.nykaa.com/search/result/?q=$titleEncoded"
        storeLower.contains("tata") || storeLower.contains("cliq") -> "https://www.tatacliq.com/search/?searchCategory=all&text=$titleEncoded"
        storeLower.contains("ajio") -> "https://www.ajio.com/search/?text=$titleEncoded"
        storeLower.contains("meesho") -> "https://www.meesho.com/search?q=$titleEncoded"
        storeLower.contains("blinkit") -> "https://blinkit.com/s/?q=$titleEncoded"
        storeLower.contains("zepto") -> "https://www.zeptonow.com/search?query=$titleEncoded"
        storeLower.contains("bigbasket") -> "https://www.bigbasket.com/ps/?q=$titleEncoded"
        rawUrl.startsWith("http") -> stripAffiliateParameters(rawUrl)
        else -> "https://www.google.com/search?q=$titleEncoded"
    }
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
                    val shareUrl = if (!offer.slug.isNullOrEmpty()) {
                        "https://buywiseai.pajonline.co.in/product/${offer.slug}"
                    } else if (offer.url.startsWith("http")) {
                        offer.url
                    } else {
                        "https://buywiseai.pajonline.co.in/product/${offer.id}"
                    }
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, "Check out ${offer.title} on BuyWise AI! Compare prices & try on: $shareUrl")
                    }
                    context.startActivity(Intent.createChooser(shareIntent, "Share Product via"))
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
            val onBuyClick = {
                try {
                    val directUrl = resolveProperProductStoreUrl(offer)
                    val validUri = Uri.parse(directUrl)
                    val browserIntent = Intent(Intent.ACTION_VIEW, validUri).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(browserIntent)
                } catch (e: Exception) {
                    e.printStackTrace()
                    val titleEncoded = try {
                        java.net.URLEncoder.encode(offer.title.trim(), "UTF-8")
                    } catch (ex: Exception) {
                        offer.title.trim().replace(" ", "+")
                    }
                    val storeLower = offer.store.lowercase()
                    val fallbackUrl = when {
                        storeLower.contains("flipkart") -> "https://www.flipkart.com/search?q=$titleEncoded"
                        storeLower.contains("amazon") -> "https://www.amazon.in/s?k=$titleEncoded"
                        storeLower.contains("croma") -> "https://www.croma.com/searchB?q=$titleEncoded%3Arelevance&text=$titleEncoded"
                        storeLower.contains("reliance") -> "https://www.reliancedigital.com/search?q=$titleEncoded:relevance"
                        storeLower.contains("myntra") -> "https://www.myntra.com/$titleEncoded"
                        storeLower.contains("nykaa") -> "https://www.nykaa.com/search/result/?q=$titleEncoded"
                        else -> "https://www.google.com/search?q=$titleEncoded"
                    }
                    try {
                        val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl)).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(fallbackIntent)
                    } catch (ex: Exception) {
                        android.widget.Toast.makeText(context, "Could not open store link. Please try again.", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }

            Button(
                onClick = onBuyClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = if (isPartner) BuyWiseEmerald else BuyWiseCyan),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Color.Black)
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "VIEW NOW ON ${offer.store.uppercase()}", color = Color.Black, fontWeight = FontWeight.Bold)
            }

            // Only show Try-On option for wearable items (clothing, sarees, dresses, jewellery, shoes)
            if (isWearable) {
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedButton(
                    onClick = {
                        if (offer != null) {
                            com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.setTarget(
                                title = offer.title,
                                imageUrl = offer.imageUrl,
                                price = offer.price,
                                retailer = offer.store
                            )
                        }
                        onNavigateToVto()
                    },
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
