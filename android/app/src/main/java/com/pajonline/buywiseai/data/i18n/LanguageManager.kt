package com.pajonline.buywiseai.data.i18n

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

data class LanguageOption(
    val code: String,
    val name: String,
    val flag: String
)

object LanguageManager {
    val supportedLanguages = listOf(
        LanguageOption("en", "English", "🇮🇳"),
        LanguageOption("hi", "हिंदी", "🇮🇳"),
        LanguageOption("bn", "বাংলা", "🇮🇳"),
        LanguageOption("ta", "தமிழ்", "🇮🇳"),
        LanguageOption("te", "తెలుగు", "🇮🇳"),
        LanguageOption("mr", "मराठी", "🇮🇳")
    )

    var currentLanguageCode by mutableStateOf("en")

    private val translations = mapOf(
        "en" to mapOf(
            "app_tagline" to "AI Shopping & Virtual Try-On",
            "search_placeholder" to "Search sarees, sneakers, phones...",
            "compare_btn" to "Compare Across 14 Retailers ➔",
            "competition_title" to "Weekly BuyWise Challenge",
            "vote_now" to "Vote Entry",
            "try_on_now" to "✨ Try Product",
            "ai_assistant" to "BuyWise AI Assistant",
            "nav_home" to "Home",
            "nav_search" to "SmartCompare",
            "nav_comp" to "Challenge",
            "nav_vto" to "Try-On",
            "nav_profile" to "Profile"
        ),
        "hi" to mapOf(
            "app_tagline" to "एआई शॉपिंग और वर्चुअल ट्राई-ऑन",
            "search_placeholder" to "साड़ी, जूते, मोबाइल खोजें...",
            "compare_btn" to "14 रिटेलर्स में कीमतों की तुलना करें ➔",
            "competition_title" to "साप्ताहिक बायवाइज़ चैलेंज",
            "vote_now" to "वोट करें",
            "try_on_now" to "✨ ट्राई करें",
            "ai_assistant" to "बायवाइज़ एआई असिस्टेंट",
            "nav_home" to "होम",
            "nav_search" to "स्मार्ट तुलना",
            "nav_comp" to "चैलेंज",
            "nav_vto" to "ट्राई-ऑन",
            "nav_profile" to "प्रोफ़ाइल"
        ),
        "bn" to mapOf(
            "app_tagline" to "এআই শপিং ও ভার্চুয়াল ট্রাই-অন",
            "search_placeholder" to "শাড়ি, জুতো, ফোন খুঁজুন...",
            "compare_btn" to "১৪টি স্টোরে মূল্য তুলনা করুন ➔",
            "competition_title" to "সাপ্তাহিক বাইওয়াইজ চ্যালেঞ্জ",
            "vote_now" to "ভোট দিন",
            "try_on_now" to "✨ ট্রাই করুন",
            "ai_assistant" to "বাইওয়াইজ এআই অ্যাসিস্ট্যান্ট",
            "nav_home" to "হোম",
            "nav_search" to "স্মার্ট তুলনা",
            "nav_comp" to "চ্যালেঞ্জ",
            "nav_vto" to "ট্রাই-অন",
            "nav_profile" to "প্রোফাইল"
        ),
        "ta" to mapOf(
            "app_tagline" to "AI ஷாப்பிங் & விர்ச்சுவல் ட்ரை-ஆன்",
            "search_placeholder" to "புடவை, போன் தேடுங்கள்...",
            "compare_btn" to "14 கடைகளில் விலையை ஒப்பிடுக ➔",
            "competition_title" to "வாராந்திர பைவைஸ் சவால்",
            "vote_now" to "வாக்களிக்கவும்",
            "try_on_now" to "✨ ட்ரை செய்யுங்கள்",
            "ai_assistant" to "பைவைஸ் AI உதவியாளர்",
            "nav_home" to "முகப்பு",
            "nav_search" to "ஒப்பீடு",
            "nav_comp" to "சவால்",
            "nav_vto" to "ட்ரை-ஆன்",
            "nav_profile" to "சுயவிவரம்"
        ),
        "te" to mapOf(
            "app_tagline" to "AI షాపింగ్ & వర్చువల్ ట్రై-ఆన్",
            "search_placeholder" to "చీరలు, ఫోన్లు శోధించండి...",
            "compare_btn" to "14 స్టోర్లలో ధరలను పోల్చండి ➔",
            "competition_title" to "వారపు బైవైజ్ ఛాలెంజ్",
            "vote_now" to "ఓటు వేయండి",
            "try_on_now" to "✨ ట్రై చేయండి",
            "ai_assistant" to "బైవైజ్ AI అసిస్టెంట్",
            "nav_home" to "హోమ్",
            "nav_search" to "స్మార్ట్ పోలిక",
            "nav_comp" to "ఛాలెంజ్",
            "nav_vto" to "ట్రై-ఆన్",
            "nav_profile" to "ప్రొఫైల్"
        ),
        "mr" to mapOf(
            "app_tagline" to "AI शॉपिंग आणि व्हर्च्युअल ट्राय-ऑन",
            "search_placeholder" to "साडी, फोन शोधा...",
            "compare_btn" to "14 स्टोअर्समध्ये किमतींची तुलना करा ➔",
            "competition_title" to "साप्ताहिक बायवाइझ चॅलेंज",
            "vote_now" to "मत द्या",
            "try_on_now" to "✨ ट्राय करा",
            "ai_assistant" to "बायवाइझ AI असिस्टंट",
            "nav_home" to "होम",
            "nav_search" to "स्मार्ट तुलना",
            "nav_comp" to "चॅलेंज",
            "nav_vto" to "ट्राय-ऑन",
            "nav_profile" to "प्रोफाइल"
        )
    )

    fun getString(key: String): String {
        return translations[currentLanguageCode]?.get(key)
            ?: translations["en"]?.get(key)
            ?: key
    }
}

@Composable
fun tr(key: String): String {
    return LanguageManager.getString(key)
}
