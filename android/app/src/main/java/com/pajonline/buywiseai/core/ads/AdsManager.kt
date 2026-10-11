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

    // PRODUCTION ADMOB AD UNIT IDS (FROM DREAMZ PROPERTIES APP)
    const val PROD_APP_ID = "ca-app-pub-7229466318707515~8895158400"
    const val PROD_BANNER_ID = "ca-app-pub-7229466318707515/5842117090"
    const val PROD_NATIVE_ID = "ca-app-pub-7229466318707515/1571699595"
    const val PROD_INTERSTITIAL_ID = "ca-app-pub-7229466318707515/1140791462"
    const val PROD_REWARDED_ID = "ca-app-pub-7229466318707515/5019990015"

    // Toggle for debug vs production environment (defaults to test ads in debug builds, real ads in release builds)
    var useTestAds: Boolean = com.pajonline.buywiseai.BuildConfig.DEBUG

    val bannerAdUnitId: String
        get() = if (useTestAds) TEST_BANNER_ID else PROD_BANNER_ID

    val nativeAdUnitId: String
        get() = if (useTestAds) TEST_NATIVE_ID else PROD_NATIVE_ID

    val interstitialAdUnitId: String
        get() = if (useTestAds) TEST_INTERSTITIAL_ID else PROD_INTERSTITIAL_ID

    val rewardedAdUnitId: String
        get() = if (useTestAds) TEST_REWARDED_ID else PROD_REWARDED_ID

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
