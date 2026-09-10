package com.pajonline.buywiseai.ui.screens.home

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import com.pajonline.buywiseai.R
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.data.i18n.LanguageManager
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.data.repository.CompetitionRepository
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.components.CoreExperienceCards
import com.pajonline.buywiseai.ui.components.GenGStoreShowcase
import com.pajonline.buywiseai.ui.components.ShoppingJourneyBar
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

@Composable
fun HomeScreen(
    onNavigateToSearch: (String) -> Unit,
    onNavigateToVto: () -> Unit = {},
    onNavigateToCompetition: () -> Unit = {},
    onNavigateToAlerts: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onOpenAiAssistant: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var showLangMenu by remember { mutableStateOf(false) }

    val activeComp = remember { CompetitionRepository.getActiveCompetition() }
    val pastWinnerPair = remember { CompetitionRepository.getPastWinnerCompetition() }

    val retailers = listOf("Amazon India", "Flipkart", "Meesho", "Myntra", "AJIO", "Nykaa", "Tata CLiQ", "eBay")
    val categories = listOf(
        "Fashion & Clothing" to BuyWiseNeonPink,
        "Mobiles & Tech" to BuyWiseCyan,
        "Audio & Gadgets" to BuyWiseGold,
        "Beauty & Care" to BuyWiseEmerald
    )

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Spacer(modifier = Modifier.height(8.dp))

                // BRAND TOP HEADER BAR WITH LANGUAGE SELECTOR
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BuyWiseLogo(
                        logoHeight = 34.dp,
                        fontSize = 20
                    )

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Language Switcher Pill Dropdown
                        Box {
                            val activeLang = LanguageManager.supportedLanguages.firstOrNull { it.code == LanguageManager.currentLanguageCode }
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF1E1B2E), RoundedCornerShape(16.dp))
                                    .border(1.dp, BuyWiseCyan.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                                    .clickable { showLangMenu = true }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "${activeLang?.flag ?: "🌐"} ${activeLang?.name ?: "EN"} ▾",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = BuyWiseCyan
                                )
                            }

                            DropdownMenu(
                                expanded = showLangMenu,
                                onDismissRequest = { showLangMenu = false },
                                modifier = Modifier.background(Color(0xFF120E24))
                            ) {
                                LanguageManager.supportedLanguages.forEach { lang ->
                                    DropdownMenuItem(
                                        text = { Text("${lang.flag} ${lang.name}", color = Color.White, fontSize = 13.sp) },
                                        onClick = {
                                            LanguageManager.currentLanguageCode = lang.code
                                            showLangMenu = false
                                        }
                                    )
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color(0xFF1E1B2E), CircleShape)
                                .clickable { onNavigateToAlerts() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = "Price Alerts",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color(0xFF1E1B2E), CircleShape)
                                .clickable { onNavigateToProfile() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // TOP SECTION 1: SmartCompare Live Search Engine
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.35f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "SmartCompare Live Search Engine",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = tr("app_tagline"),
                            fontSize = 11.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text(tr("search_placeholder"), color = Color.Gray) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = BuyWiseCyan) },
                            trailingIcon = {
                                IconButton(
                                    onClick = {
                                        searchQuery = "red saree under 3000"
                                        onNavigateToSearch(searchQuery)
                                    }
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .background(BuyWiseCyan.copy(alpha = 0.25f), CircleShape)
                                            .border(1.dp, BuyWiseCyan, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("🎙️", fontSize = 16.sp)
                                    }
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { if (searchQuery.isNotBlank()) onNavigateToSearch(searchQuery) else onNavigateToSearch("iPhone 17") },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = tr("compare_btn"), color = Color.Black, fontWeight = FontWeight.Black)
                            }

                            Button(
                                onClick = onNavigateToVto,
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(text = "✨ AI Trial Room", color = Color.White, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // TOP SECTION 1B: WEEKLY BUYWISE CHALLENGE & WINNER SPOTLIGHT CARD
                if (activeComp != null) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToCompetition() },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A122E)),
                        shape = RoundedCornerShape(20.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .background(BuyWiseGold, RoundedCornerShape(10.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("🏆 THIS WEEK'S BUYWISE CHALLENGE", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.Black)
                                }
                                Text("🆓 Free Entry", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(activeComp.title, fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Featured: ${activeComp.featuredProductTitle} (₹${activeComp.featuredProductPrice})", fontSize = 12.sp, color = Color.LightGray)

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = onNavigateToVto,
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(tr("try_on_now"), color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
                                }

                                Button(
                                    onClick = onNavigateToCompetition,
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2D2545)),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(tr("vote_now"), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // CATEGORIES SECTION (After Hero & Challenge Banner, Before Gen G Showcase)
                Text(
                    text = "Shop by Category Bestsellers 🏆",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { (catName, catColor) ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(catColor.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                                .border(1.dp, catColor.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                .clickable { onNavigateToSearch(catName) }
                                .padding(vertical = 12.dp, horizontal = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = catName,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = catColor
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 2: Exclusive Gen G Store Showcase
                GenGStoreShowcase(
                    onViewAllClick = { onNavigateToSearch("Gen-G Store") },
                    onTryOnClick = { prod -> onNavigateToVto() },
                    onBuyNowClick = { prod -> onNavigateToSearch(prod.title) }
                )

                Spacer(modifier = Modifier.height(28.dp))

                // SECTION 3: See Compare Try On Save Buy
                ShoppingJourneyBar(onStepClick = { stepId ->
                    when (stepId) {
                        "see" -> onNavigateToSearch("Saree")
                        "compare" -> onNavigateToSearch("iPhone")
                        "tryon" -> onNavigateToVto()
                        "save" -> onNavigateToSearch("Coupons")
                        "buy" -> onNavigateToSearch("Bestsellers")
                    }
                })

                Spacer(modifier = Modifier.height(16.dp))

                CoreExperienceCards(
                    onCompareClick = { onNavigateToSearch("iPhone 17") },
                    onTryOnClick = onNavigateToVto,
                    onCouponsClick = { onNavigateToSearch("Coupons") }
                )

                Spacer(modifier = Modifier.height(28.dp))

                // SECTION 6: Trending Comparisons
                Text(
                    text = "Trending Comparisons 🔥",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(10.dp))
                TrendingComparisonCard(
                    title = "iPhone 17 (256 GB)",
                    amazonPrice = "₹82,900",
                    flipkartPrice = "₹83,999",
                    recommendation = "Amazon (₹82,900 Best Price)",
                    score = "9.9",
                    tag = "🔥 LATEST TRENDING",
                    onClick = { onNavigateToSearch("iPhone 17") }
                )

                Spacer(modifier = Modifier.height(12.dp))

                TrendingComparisonCard(
                    title = "Samsung Galaxy S24 Ultra",
                    amazonPrice = "₹1,19,999",
                    flipkartPrice = "₹1,21,999",
                    recommendation = "Amazon (₹1,19,999 Deal)",
                    score = "9.7",
                    tag = "ANDROID FLAGSHIP",
                    onClick = { onNavigateToSearch("Samsung S24 Ultra") }
                )

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 7: Supported Retailers Network
                Text(
                    text = "Supported Retailers in India 🇮🇳",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(retailers) { store ->
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF1E1B2E), RoundedCornerShape(12.dp))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(text = store, fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun TrendingComparisonCard(
    title: String,
    amazonPrice: String,
    flipkartPrice: String,
    recommendation: String,
    score: String,
    tag: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWisePurple.copy(alpha = 0.35f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .background(
                            brush = Brush.horizontalGradient(listOf(BuyWisePurple, BuyWiseNeonPink)),
                            shape = RoundedCornerShape(10.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(text = "#$score AI SCORE", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White)
                }

                Text(text = tag, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseNeonPink)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(text = title, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Amazon", fontSize = 12.sp, color = Color.Gray)
                Text(text = amazonPrice, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Flipkart", fontSize = 12.sp, color = Color.Gray)
                Text(text = flipkartPrice, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0C0A14), RoundedCornerShape(10.dp))
                    .padding(10.dp)
            ) {
                Column {
                    Text(text = "OUR RECOMMENDATION", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = BuyWiseCyan)
                    Text(text = recommendation, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
