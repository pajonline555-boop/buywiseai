package com.pajonline.buywiseai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pajonline.buywiseai.data.repository.PrimeState
import com.pajonline.buywiseai.data.repository.PrimeSubscriptionRepository
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class PrimeViewModel(
    private val repository: PrimeSubscriptionRepository = PrimeSubscriptionRepository()
) : ViewModel() {

    val primeState: StateFlow<PrimeState> = repository.primeState

    init {
        refreshPrimeStatus()
    }

    fun refreshPrimeStatus() {
        viewModelScope.launch {
            repository.fetchPrimeStatus()
        }
    }

    fun verifyGooglePlayToken(purchaseToken: String, productId: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            repository.verifyGooglePlayPurchaseToken(purchaseToken, productId, onResult)
        }
    }
}
