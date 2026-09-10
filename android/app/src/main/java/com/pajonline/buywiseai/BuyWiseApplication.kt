package com.pajonline.buywiseai

import android.app.Application
import android.util.Log

class BuyWiseApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "BuyWise AI Native Android Client Initialized.")
    }

    companion object {
        private const val TAG = "BuyWiseApp"
    }
}
