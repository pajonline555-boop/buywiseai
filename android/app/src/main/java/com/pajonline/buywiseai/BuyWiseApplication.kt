package com.pajonline.buywiseai

import android.app.Application
import android.util.Log
import coil.ImageLoader
import coil.ImageLoaderFactory
import com.pajonline.buywiseai.core.coil.DataUriFetcher

class BuyWiseApplication : Application(), ImageLoaderFactory {

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Crash safety net to log any unexpected thread crashes
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "Uncaught exception on thread: ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        Log.i(TAG, "BuyWise AI Native Android Client Initialized.")
        try {
            com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.init(this)
        } catch (e: Throwable) {
            Log.w(TAG, "NotificationManager init note: ${e.message}")
        }
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .components {
                add(DataUriFetcher.StringFactory())
                add(DataUriFetcher.Factory())
            }
            .respectCacheHeaders(false)
            .build()
    }

    companion object {
        private const val TAG = "BuyWiseApp"
        lateinit var instance: BuyWiseApplication
            private set
    }
}
