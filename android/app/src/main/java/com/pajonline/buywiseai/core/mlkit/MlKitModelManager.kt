package com.pajonline.buywiseai.core.mlkit

import android.content.Context
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateRemoteModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

data class ModelStatus(
    val languageCode: String,
    val isDownloaded: Boolean,
    val isDownloading: Boolean = false,
    val errorMessage: String? = null
)

class MlKitModelManager(private val context: Context) {

    private val remoteModelManager = RemoteModelManager.getInstance()
    private val prefs = context.getSharedPreferences("buywise_mlkit_prefs", Context.MODE_PRIVATE)

    private val _downloadOnWifiOnly = MutableStateFlow(prefs.getBoolean("download_wifi_only", false))
    val downloadOnWifiOnly: StateFlow<Boolean> = _downloadOnWifiOnly.asStateFlow()

    fun setDownloadOnWifiOnly(wifiOnly: Boolean) {
        prefs.edit().putBoolean("download_wifi_only", wifiOnly).apply()
        _downloadOnWifiOnly.value = wifiOnly
    }

    suspend fun getDownloadedModels(): List<String> = suspendCancellableCoroutine { continuation ->
        remoteModelManager.getDownloadedModels(TranslateRemoteModel::class.java)
            .addOnSuccessListener { models ->
                val langList = models.map { it.language }
                if (continuation.isActive) {
                    continuation.resume(langList)
                }
            }
            .addOnFailureListener {
                if (continuation.isActive) {
                    continuation.resume(emptyList())
                }
            }
    }

    suspend fun deleteModel(languageCode: String): Boolean = suspendCancellableCoroutine { continuation ->
        val model = TranslateRemoteModel.Builder(languageCode).build()
        remoteModelManager.deleteDownloadedModel(model)
            .addOnSuccessListener {
                if (continuation.isActive) continuation.resume(true)
            }
            .addOnFailureListener {
                if (continuation.isActive) continuation.resume(false)
            }
    }
}
