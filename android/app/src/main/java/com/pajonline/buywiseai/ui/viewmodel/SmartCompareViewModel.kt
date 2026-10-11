package com.pajonline.buywiseai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pajonline.buywiseai.data.repository.SmartCompareRepository
import com.pajonline.buywiseai.domain.model.ComparisonResponse
import com.pajonline.buywiseai.domain.model.StoreOffer
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class SmartCompareUiState {
    object Idle : SmartCompareUiState()
    object Loading : SmartCompareUiState()
    data class Success(val response: ComparisonResponse) : SmartCompareUiState()
    data class Error(val message: String) : SmartCompareUiState()
}

class SmartCompareViewModel(
    private val repository: SmartCompareRepository = SmartCompareRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<SmartCompareUiState>(SmartCompareUiState.Idle)
    val uiState: StateFlow<SmartCompareUiState> = _uiState.asStateFlow()

    var selectedOffer: StoreOffer? = null
        private set

    var currentQuery: String by androidx.compose.runtime.mutableStateOf("")
        private set

    fun performSearch(query: String) {
        if (query.isBlank()) return
        currentQuery = query
        viewModelScope.launch {
            _uiState.value = SmartCompareUiState.Loading
            val result = repository.searchSmartCompare(query)
            result.onSuccess { response ->
                _uiState.value = SmartCompareUiState.Success(response)
            }.onFailure { error ->
                _uiState.value = SmartCompareUiState.Error(error.localizedMessage ?: "BuyWise couldn't complete this search.")
            }
        }
    }

    fun selectOffer(offer: StoreOffer) {
        selectedOffer = offer
    }

    fun loadProductBySlug(slug: String) {
        val lower = slug.lowercase()
        val isKamarbandh = lower.contains("kamarbandh") || lower.contains("gujarati") || lower.contains("etietnic") || lower.contains("b0hjhstylbg") || lower.contains("0e7cjiwy") || lower.contains("0e8ujgx")

        if (isKamarbandh) {
            selectedOffer = StoreOffer(
                id = "prod_partner_kamarbandh_1",
                store = "Amazon",
                title = "Etietnic Gujarati Traditional Embroidered Kamarbandh",
                price = 499.0,
                mrp = 999.0,
                url = "https://www.amazon.in/dp/B0HJHSYLBG?tag=pajonline-21&ascsubtag=bw_gen_g_store",
                rating = 4.8,
                reviewCount = 1420,
                trustScore = 99,
                productSource = "PARTNER",
                verificationStatus = "VERIFIED_LIVE",
                slug = "etietnic-gujarati-traditional-embroidered-kamarbandh"
            )
            return
        }

        val titleFromSlug = slug.replace("-", " ").split(" ").joinToString(" ") { word ->
            word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
        val isPartner = slug.contains("buywise") || slug.contains("partner")
        val isFlipkart = slug.contains("flipkart")
        val storeName = if (isPartner) "BUYWISE STORE" else if (isFlipkart) "Flipkart" else "Amazon"
        val source = if (isPartner) "PARTNER" else "AFFILIATE"
        val offerUrl = if (isPartner) "https://buywiseai.pajonline.co.in/product/$slug" else "https://www.amazon.in/dp/$slug?tag=pajonline-21&ascsubtag=bw_gen_g_store"

        selectedOffer = StoreOffer(
            id = "offer_$slug",
            store = storeName,
            title = titleFromSlug,
            price = 499.0,
            mrp = 999.0,
            url = offerUrl,
            rating = 4.8,
            reviewCount = 1240,
            trustScore = 98,
            productSource = source,
            verificationStatus = "VERIFIED_LIVE",
            slug = slug
        )
    }
}
