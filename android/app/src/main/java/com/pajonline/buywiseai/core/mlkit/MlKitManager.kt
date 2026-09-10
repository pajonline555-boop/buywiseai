package com.pajonline.buywiseai.core.mlkit

import android.content.Context
import android.graphics.Bitmap
import com.google.mlkit.nl.translate.TranslateLanguage

class MlKitManager(context: Context) {

    val textRecognitionService = MlKitTextRecognitionService()
    val translationService = MlKitTranslationService()
    val languageService = MlKitLanguageService()
    val modelManager = MlKitModelManager(context)

    suspend fun recognizeText(bitmap: Bitmap): String {
        return textRecognitionService.extractTextFromBitmap(bitmap)
    }

    suspend fun detectLanguage(text: String): String {
        return languageService.identifyLanguage(text)
    }

    suspend fun translateText(text: String, sourceLang: String = TranslateLanguage.HINDI, targetLang: String = TranslateLanguage.ENGLISH): String {
        val wifiOnly = modelManager.downloadOnWifiOnly.value
        return translationService.translateText(text, sourceLang, targetLang, wifiOnly)
    }

    suspend fun smartProcessProductImage(bitmap: Bitmap): Pair<String, String> {
        val rawText = recognizeText(bitmap)
        if (rawText.isBlank()) {
            return Pair("", "No text detected in product image")
        }

        val detectedLang = detectLanguage(rawText)
        return if (detectedLang == "hi") {
            val translated = translateText(rawText, TranslateLanguage.HINDI, TranslateLanguage.ENGLISH)
            Pair(translated, "Recognized Hindi product text ➔ Translated to English")
        } else {
            Pair(rawText, "Recognized product text ($detectedLang)")
        }
    }
}
