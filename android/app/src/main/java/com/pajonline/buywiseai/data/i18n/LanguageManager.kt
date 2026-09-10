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
        LanguageOption("hi-en", "Hinglish", "🇮🇳"),
        LanguageOption("bn", "বাংলা", "🇮🇳"),
        LanguageOption("mr", "मराठी", "🇮🇳"),
        LanguageOption("te", "తెలుగు", "🇮🇳"),
        LanguageOption("ta", "தமிழ்", "🇮🇳"),
        LanguageOption("gu", "ગુજરાતી", "🇮🇳"),
        LanguageOption("ur", "اردو", "🇮🇳"),
        LanguageOption("kn", "ಕನ್ನಡ", "🇮🇳"),
        LanguageOption("or", "ଓଡ଼ିଆ", "🇮🇳"),
        LanguageOption("ml", "മലയാളം", "🇮🇳"),
        LanguageOption("pa", "ਪੰਜਾਬੀ", "🇮🇳"),
        LanguageOption("as", "অসমীয়া", "🇮🇳")
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
        "hi-en" to mapOf(
            "app_tagline" to "AI Shopping & Trial Room Deals",
            "search_placeholder" to "Search saree, shoes, latest mobile...",
            "compare_btn" to "Compare Prices Across 14 Stores ➔",
            "competition_title" to "Weekly BuyWise Challenge",
            "vote_now" to "Vote Entry",
            "try_on_now" to "✨ Try On",
            "ai_assistant" to "BuyWise Maya Assistant",
            "nav_home" to "Home",
            "nav_search" to "Compare",
            "nav_comp" to "Challenge",
            "nav_vto" to "Trial Room",
            "nav_profile" to "Profile"
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
        ),
        "gu" to mapOf(
            "app_tagline" to "AI શોપિંગ અને વર્ચ્યુઅલ ટ્રાય-ઓન",
            "search_placeholder" to "સાડી, ચંપલ, ફોન શોધો...",
            "compare_btn" to "14 સ્ટોર્સમાં કિંમતોની સરખામણી કરો ➔",
            "competition_title" to "સાપ્તાહિક બાયવાઇઝ ચેલેન્જ",
            "vote_now" to "વોટ આપો",
            "try_on_now" to "✨ ટ્રાય કરો",
            "ai_assistant" to "બાયવાઇઝ AI આસિસ્ટન્ટ",
            "nav_home" to "હોમ",
            "nav_search" to "સરખામણી",
            "nav_comp" to "ચેલેન્જ",
            "nav_vto" to "ટ્રાય-ઓન",
            "nav_profile" to "પ્રોફાઇલ"
        ),
        "ur" to mapOf(
            "app_tagline" to "AI شاپنگ اور ورچوئل ٹرائی آن",
            "search_placeholder" to "ساڑی، جوتے، فون تلاش کریں...",
            "compare_btn" to "14 اسٹورز میں قیمتوں کا موازنہ کریں ➔",
            "competition_title" to "ہفتہ وار بائی وائز چیلنج",
            "vote_now" to "ووث دیں",
            "try_on_now" to "✨ ٹرائی کریں",
            "ai_assistant" to "بائی وائز AI اسسٹنٹ",
            "nav_home" to "ہوم",
            "nav_search" to "موازنہ",
            "nav_comp" to "چیلنج",
            "nav_vto" to "ٹرائی آن",
            "nav_profile" to "پروفائل"
        ),
        "kn" to mapOf(
            "app_tagline" to "AI ಶಾಪಿಂಗ್ ಮತ್ತು ವರ್ಚುವಲ್ ಟ್ರೈ-ಆನ್",
            "search_placeholder" to "ಸೀರೆ, ಷೂ, ಫೋನ್ ಹುಡುಕಿ...",
            "compare_btn" to "14 ಅಂಗಡಿಗಳಲ್ಲಿ ಬೆಲೆ ಹೋಲಿಕೆ ಮಾಡಿ ➔",
            "competition_title" to "ವಾರದ ಬೈವೈಸ್ ಚಾಲೆಂಜ್",
            "vote_now" to "ಮತ ಹಾಕಿ",
            "try_on_now" to "✨ ಟ್ರೈ ಮಾಡಿ",
            "ai_assistant" to "ಬೈವೈಸ್ AI ಅಸಿಸ್ಟೆಂಟ್",
            "nav_home" to "ಹೋಮ್",
            "nav_search" to "ಹೋಲಿಕೆ",
            "nav_comp" to "ಚಾಲೆಂಜ್",
            "nav_vto" to "ಟ್ರೈ-ಆನ್",
            "nav_profile" to "ಪ್ರೊಫೈಲ್"
        ),
        "or" to mapOf(
            "app_tagline" to "AI ସପିଂ ଏବଂ ଭର୍ଚୁଆଲ୍ ଟ୍ରାଏ-ଅନ୍",
            "search_placeholder" to "ଶାଢୀ, ଜୁତା, ଫୋନ୍ ଖୋଜନ୍ତୁ...",
            "compare_btn" to "14 ଟି ଷ୍ଟୋରରେ ମୂଲ୍ୟ ତୁଳନା କରନ୍ତୁ ➔",
            "competition_title" to "ସାପ୍ତାହିକ ବାଏୱାଇଜ୍ ଚ୍ୟାଲେଞ୍ଜ",
            "vote_now" to "ଭୋଟ୍ ଦିଅନ୍ତୁ",
            "try_on_now" to "✨ ଟ୍ରାଏ କରନ୍ତୁ",
            "ai_assistant" to "ବାଏୱାଇଜ୍ AI ଆସିଷ୍ଟାଣ୍ଟ",
            "nav_home" to "ହୋମ୍",
            "nav_search" to "ତୁଳନା",
            "nav_comp" to "ଚ୍ୟାଲେଞ୍ଜ",
            "nav_vto" to "ଟ୍ରାଏ-ଅନ୍",
            "nav_profile" to "ପ୍ରୋଫାଇଲ୍"
        ),
        "ml" to mapOf(
            "app_tagline" to "AI ഷോപ്പിംഗ് & വെർച്വൽ ട്രൈ-ഓൺ",
            "search_placeholder" to "സാരി, ഷൂസ്, ഫോൺ തിരയുക...",
            "compare_btn" to "14 സ്റ്റോറുകളിൽ വില താരതമ്യം ചെയ്യുക ➔",
            "competition_title" to "ആഴ്ചയിലെ ബൈവൈസ് ചലഞ്ച്",
            "vote_now" to "വോട്ട് ചെയ്യുക",
            "try_on_now" to "✨ ട്രൈ ചെയ്യുക",
            "ai_assistant" to "ബൈവൈസ് AI അസിസ്റ്റന്റ്",
            "nav_home" to "ഹോം",
            "nav_search" to "താരതമ്യം",
            "nav_comp" to "ചലഞ്ച്",
            "nav_vto" to "ട്രൈ-ഓൺ",
            "nav_profile" to "പ്രൊഫൈൽ"
        ),
        "pa" to mapOf(
            "app_tagline" to "AI ਸ਼ਾਪਿੰਗ ਅਤੇ ਵਰਚੁਅਲ ਟਰਾਈ-ਆਨ",
            "search_placeholder" to "ਸਾੜ੍ਹੀ, ਜੁੱਤੀਆਂ, ਫੋਨ ਖੋਜੋ...",
            "compare_btn" to "14 ਸਟੋਰਾਂ ਵਿੱਚ ਕੀਮਤਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ ➔",
            "competition_title" to "ਹਫਤਾਵਾਰੀ ਬਾਈਵਾਈਜ਼ ਚੈਲੇਂਜ",
            "vote_now" to "ਵੋਟ ਦਿਓ",
            "try_on_now" to "✨ ਟਰਾਈ ਕਰੋ",
            "ai_assistant" to "ਬਾਈਵਾਈਜ਼ AI ਅਸਿਸਟੈਂਟ",
            "nav_home" to "ਹੋਮ",
            "nav_search" to "ਤੁਲਨਾ",
            "nav_comp" to "ਚੈਲੇਂਜ",
            "nav_vto" to "ਟਰਾਈ-ਆਨ",
            "nav_profile" to "ਪ੍ਰੋਫਾਈਲ"
        ),
        "as" to mapOf(
            "app_tagline" to "AI শ্বপিং আৰু ভাৰ্চুৱেল ট্ৰাই-অন",
            "search_placeholder" to "শাৰী, জোতা, ফোন সন্ধান কৰক...",
            "compare_btn" to "১৪ টা ষ্ট'ৰত মূল্য তুলনা কৰক ➔",
            "competition_title" to "সপ্তাহেকীয়া বাইৱাইজ চেলেঞ্জ",
            "vote_now" to "ভোট দিয়ক",
            "try_on_now" to "✨ ট্ৰাই কৰক",
            "ai_assistant" to "বাইৱাইজ AI সহকাৰী",
            "nav_home" to "হোম",
            "nav_search" to "তুলনা",
            "nav_comp" to "চেলেঞ্জ",
            "nav_vto" to "ট্ৰাই-অন",
            "nav_profile" to "প্ৰফাইল"
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
