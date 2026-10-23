package com.pajonline.buywiseai

import android.app.Application
import android.util.Log

class BuyWiseApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "BuyWise AI Native Android Client Initialized.")
        try {
            com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.init(this)
        } catch (e: Throwable) {
            Log.w(TAG, "NotificationManager init note: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "BuyWiseApp"
        lateinit var instance: BuyWiseApplication
            private set
    }
}
