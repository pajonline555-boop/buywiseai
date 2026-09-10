package com.pajonline.buywiseai.core.mlkit

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class MlKitTranslationService {

    suspend fun translateText(
        text: String,
        sourceLangCode: String = TranslateLanguage.HINDI,
        targetLangCode: String = TranslateLanguage.ENGLISH,
        requireWifi: Boolean = false
    ): String = suspendCancellableCoroutine { continuation ->
        if (text.isBlank()) {
            continuation.resume(text)
            return@suspendCancellableCoroutine
        }

        val options = TranslatorOptions.Builder()
            .setSourceLanguage(sourceLangCode)
            .setTargetLanguage(targetLangCode)
            .build()

        val translator = Translation.getClient(options)
        val conditionsBuilder = DownloadConditions.Builder()
        if (requireWifi) {
            conditionsBuilder.requireWifi()
        }
        val conditions = conditionsBuilder.build()

        translator.downloadModelIfNeeded(conditions)
            .addOnSuccessListener {
                translator.translate(text)
                    .addOnSuccessListener { translatedText ->
                        translator.close()
                        if (continuation.isActive) {
                            continuation.resume(translatedText)
                        }
                    }
                    .addOnFailureListener {
                        translator.close()
                        if (continuation.isActive) {
                            continuation.resume(text) // Graceful fallback
                        }
                    }
            }
            .addOnFailureListener {
                translator.close()
                if (continuation.isActive) {
                    continuation.resume(text) // Graceful fallback if model download fails
                }
            }
    }
}
