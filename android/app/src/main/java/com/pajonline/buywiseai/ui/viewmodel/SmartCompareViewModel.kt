package com.pajonline.buywiseai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pajonline.buywiseai.data.repository.SmartCompareRepository
import com.pajonline.buywiseai.domain.model.ComparisonResponse
import com.pajonline.buywiseai.domain.model.StoreOffer
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

    fun performSearch(query: String) {
        if (query.isBlank()) return
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
}
