package com.pajonline.buywiseai.core.ads

import android.content.Context
import com.google.android.gms.ads.MobileAds
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AdsManager {

    // OFFICIAL GOOGLE TEST AD UNIT IDS (FOR SAFE DEVELOPMENT & AUDITING)
    const val TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917"
    const val TEST_NATIVE_ID = "ca-app-pub-3940256099942544/2247696110"

    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    fun initialize(context: Context) {
        if (_isInitialized.value) return
        try {
            MobileAds.initialize(context) { status ->
                _isInitialized.value = true
            }
        } catch (e: Exception) {
            _isInitialized.value = false
        }
    }
}
