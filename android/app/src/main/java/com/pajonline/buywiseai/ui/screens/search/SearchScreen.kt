package com.pajonline.buywiseai.ui.screens.search

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.domain.model.StoreOffer
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareUiState
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareViewModel

@Composable
fun SearchScreen(
    viewModel: SmartCompareViewModel = remember { SmartCompareViewModel() },
    onOfferSelect: (StoreOffer) -> Unit = {}
) {
    var query by remember { mutableStateOf("Saree") }
    val uiState by viewModel.uiState.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(
                text = "SmartCompare Matrix",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Real-time price & trust aggregation across 14 stores",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Search Bar
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Search iPhone, Saree, Shoes...", color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = BuyWiseCyan) },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = { viewModel.performSearch(query) },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(text = "Search", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            when (val state = uiState) {
                is SmartCompareUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = BuyWiseCyan)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(text = "Aggregating 14 stores...", color = Color.LightGray, fontSize = 13.sp)
                        }
                    }
                }
                is SmartCompareUiState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF33141E))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "Search Error", color = Color(0xFFFF6B6B), fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = state.message, color = Color.LightGray, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { viewModel.performSearch(query) },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                            ) {
                                Text("RETRY SEARCH", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                is SmartCompareUiState.Success -> {
                    val response = state.response
                    val summary = response.summary

                    // Search Summary Metrics Bar
                    if (summary != null) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("LOWEST PRICE", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("₹${summary.lowestPrice.toInt()}", fontSize = 15.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                                }
                                Column {
                                    Text("MAX SAVINGS", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("₹${summary.maximumSavings.toInt()}", fontSize = 15.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                                }
                                Column {
                                    Text("STORES CHECKED", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                    Text("${summary.totalStoresChecked} Stores", fontSize = 15.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    if (response.stores.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No store offers found for this query.", color = Color.Gray)
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(response.stores) { offer ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.selectOffer(offer)
                                            onOfferSelect(offer)
                                        },
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF191629)),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = offer.store,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = BuyWiseCyan
                                            )
                                            Text(
                                                text = "Trust: ${offer.trustScore ?: 95}/100",
                                                fontSize = 11.sp,
                                                color = BuyWiseEmerald
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = offer.title,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color.White,
                                            maxLines = 2
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(verticalAlignment = Alignment.Bottom) {
                                            Text(
                                                text = "₹${offer.price.toInt()}",
                                                fontSize = 18.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = BuyWiseEmerald
                                            )
                                            if (offer.mrp != null && offer.mrp > offer.price) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = "₹${offer.mrp.toInt()}",
                                                    fontSize = 13.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "Search for any product to view real price matrix", color = Color.Gray, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}
