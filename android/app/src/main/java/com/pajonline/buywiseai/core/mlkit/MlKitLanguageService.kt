package com.pajonline.buywiseai.core.mlkit

import com.google.mlkit.nl.languageid.LanguageIdentification
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class MlKitLanguageService {

    private val languageIdentifier by lazy {
        LanguageIdentification.getClient()
    }

    suspend fun identifyLanguage(text: String): String = suspendCancellableCoroutine { continuation ->
        if (text.isBlank()) {
            continuation.resume("und")
            return@suspendCancellableCoroutine
        }

        languageIdentifier.identifyLanguage(text)
            .addOnSuccessListener { languageCode ->
                if (continuation.isActive) {
                    continuation.resume(if (languageCode == "zxx") "und" else languageCode)
                }
            }
            .addOnFailureListener {
                if (continuation.isActive) {
                    continuation.resume("und")
                }
            }
    }
}
