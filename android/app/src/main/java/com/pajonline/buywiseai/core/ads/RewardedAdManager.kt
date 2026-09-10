package com.pajonline.buywiseai.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

class RewardedAdManager(private val context: Context) {

    private var rewardedAd: RewardedAd? = null
    var isEnabled: Boolean = false // Disabled by default until server reward is authorized

    fun loadAd() {
        if (!isEnabled) return
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            context,
            AdsManager.TEST_REWARDED_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    fun showRewardedAd(activity: Activity, onRewardGranted: (Int, String) -> Unit) {
        val ad = rewardedAd
        if (ad != null && isEnabled) {
            ad.show(activity) { rewardItem ->
                onRewardGranted(rewardItem.amount, rewardItem.type)
                rewardedAd = null
                loadAd()
            }
        }
    }
}
