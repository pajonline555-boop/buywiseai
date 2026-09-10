package com.pajonline.buywiseai.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

class InterstitialAdManager(private val context: Context) {

    private var interstitialAd: InterstitialAd? = null
    private var lastAdShowTime: Long = 0
    private var actionCount: Int = 0

    companion object {
        private const val MIN_INTERVAL_MS = 5 * 60 * 1000L // 5 minutes
        private const val MIN_ACTION_COUNT = 5
    }

    fun loadAd() {
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            context,
            AdsManager.TEST_INTERSTITIAL_ID,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                }
            }
        )
    }

    fun incrementActionAndShowIfEligible(activity: Activity): Boolean {
        actionCount++
        val currentTime = System.currentTimeMillis()
        val timeElapsed = currentTime - lastAdShowTime

        if (actionCount >= MIN_ACTION_COUNT && timeElapsed >= MIN_INTERVAL_MS) {
            val ad = interstitialAd
            if (ad != null) {
                ad.show(activity)
                lastAdShowTime = currentTime
                actionCount = 0
                interstitialAd = null
                loadAd() // Preload next
                return true
            }
        }
        return false
    }
}
