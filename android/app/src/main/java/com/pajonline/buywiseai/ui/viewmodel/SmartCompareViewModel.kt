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
        val titleFromSlug = slug.replace("-", " ").split(" ").joinToString(" ") { word ->
            word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
        val isPartner = slug.contains("buywise") || slug.contains("partner")
        val isFlipkart = slug.contains("flipkart")
        val storeName = if (isPartner) "BUYWISE STORE" else if (isFlipkart) "Flipkart" else "Amazon"
        val source = if (isPartner) "PARTNER" else "AFFILIATE"
        val offerUrl = if (isPartner) "https://buywiseai.pajonline.co.in/product/$slug" else "https://www.amazon.in/dp/$slug?tag=pajonline-21"

        selectedOffer = StoreOffer(
            id = "offer_$slug",
            store = storeName,
            title = titleFromSlug,
            price = 4999.0,
            mrp = 7999.0,
            url = offerUrl,
            rating = 4.8,
            reviewCount = 1240,
            trustScore = 98,
            productSource = source,
            verificationStatus = "VERIFIED_LIVE"
        )
    }
}
