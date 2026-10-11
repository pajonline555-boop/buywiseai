package com.pajonline.buywiseai.core.voice

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.Locale

enum class VoiceSearchState {
    IDLE,
    REQUESTING_PERMISSION,
    LISTENING,
    PROCESSING,
    SUCCESS,
    NO_SPEECH,
    ERROR
}

class SpeechRecognizerManager(private val context: Context) {

    private var speechRecognizer: SpeechRecognizer? = null

    fun isAvailable(): Boolean {
        return SpeechRecognizer.isRecognitionAvailable(context)
    }

    private fun triggerHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(50)
            }
        } catch (_: Exception) {}
    }

    fun startListening(
        langCode: String = "en",
        onPartialResult: (String) -> Unit = {},
        onResult: (String) -> Unit,
        onError: (String) -> Unit,
        onStateChanged: (VoiceSearchState) -> Unit
    ) {
        if (!isAvailable()) {
            onStateChanged(VoiceSearchState.ERROR)
            onError("Speech recognition is not available on this device.")
            return
        }

        destroy() // Clean up any previous instance

        try {
            triggerHapticFeedback()
            onStateChanged(VoiceSearchState.LISTENING)

            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                val locale = when (langCode.lowercase()) {
                    "hi", "hi-en" -> Locale("hi", "IN")
                    "bn" -> Locale("bn", "IN")
                    "ta" -> Locale("ta", "IN")
                    "te" -> Locale("te", "IN")
                    "gu" -> Locale("gu", "IN")
                    "mr" -> Locale("mr", "IN")
                    else -> Locale("en", "IN")
                }
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale.toString())
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, locale.toString())
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }

            speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    onStateChanged(VoiceSearchState.LISTENING)
                }

                override fun onBeginningOfSpeech() {
                    onStateChanged(VoiceSearchState.LISTENING)
                }

                override fun onRmsChanged(rmsdB: Float) {}

                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    triggerHapticFeedback()
                    onStateChanged(VoiceSearchState.PROCESSING)
                }

                override fun onError(error: Int) {
                    val (state, errorMsg) = when (error) {
                        SpeechRecognizer.ERROR_AUDIO -> VoiceSearchState.ERROR to "Audio recording error"
                        SpeechRecognizer.ERROR_CLIENT -> VoiceSearchState.ERROR to "Client side error"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> VoiceSearchState.ERROR to "Microphone permission denied"
                        SpeechRecognizer.ERROR_NETWORK -> VoiceSearchState.ERROR to "Network connection error"
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> VoiceSearchState.ERROR to "Network timeout"
                        SpeechRecognizer.ERROR_NO_MATCH -> VoiceSearchState.NO_SPEECH to "I couldn't hear you. Please try again."
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> VoiceSearchState.ERROR to "Speech recognizer is busy"
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> VoiceSearchState.NO_SPEECH to "No speech detected. Timed out."
                        else -> VoiceSearchState.ERROR to "Speech recognition error ($error)"
                    }
                    onStateChanged(state)
                    onError(errorMsg)
                }

                override fun onResults(results: Bundle?) {
                    onStateChanged(VoiceSearchState.PROCESSING)
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val text = matches[0]
                        if (text.isNotBlank()) {
                            onStateChanged(VoiceSearchState.SUCCESS)
                            onResult(text)
                        } else {
                            onStateChanged(VoiceSearchState.NO_SPEECH)
                            onError("No speech recognized.")
                        }
                    } else {
                        onStateChanged(VoiceSearchState.NO_SPEECH)
                        onError("No speech recognized.")
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val partialText = matches[0]
                        if (partialText.isNotBlank()) {
                            onPartialResult(partialText)
                        }
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })

            speechRecognizer?.startListening(intent)
        } catch (e: Exception) {
            onStateChanged(VoiceSearchState.ERROR)
            onError("Failed to start voice search: ${e.localizedMessage ?: e.message}")
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
    }

    fun destroy() {
        try {
            speechRecognizer?.destroy()
            speechRecognizer = null
        } catch (_: Exception) {}
    }
}
