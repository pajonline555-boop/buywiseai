package com.pajonline.buywiseai.data.i18n

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class BuyWiseLanguage(val code: String, val displayName: String, val flag: String) {
    ENGLISH("en", "English", "🇮🇳"),
    HINDI("hi", "हिंदी", "🇮🇳"),
    HINGLISH("hi-en", "Hinglish", "🇮🇳"),
    PUNJABI("pa", "ਪੰਜਾਬੀ", "🇮🇳"),
    BENGALI("bn", "বাংলা", "🇮🇳"),
    MARATHI("mr", "मराठी", "🇮🇳"),
    TELUGU("te", "తెలుగు", "🇮🇳"),
    TAMIL("ta", "தமிழ்", "🇮🇳"),
    GUJARATI("gu", "ગુજરાતી", "🇮🇳"),
    URDU("ur", "اردو", "🇮🇳"),
    KANNADA("kn", "ಕನ್ನಡ", "🇮🇳"),
    ODIA("or", "ଓଡ଼ିଆ", "🇮🇳"),
    MALAYALAM("ml", "മലയാളം", "🇮🇳"),
    ASSAMESE("as", "অসমীয়া", "🇮🇳");

    companion object {
        fun fromCode(code: String): BuyWiseLanguage {
            return values().firstOrNull { it.code == code } ?: ENGLISH
        }
    }
}

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
        LanguageOption("pa", "ਪੰਜਾਬੀ", "🇮🇳"),
        LanguageOption("bn", "বাংলা", "🇮🇳"),
        LanguageOption("mr", "मराठी", "🇮🇳"),
        LanguageOption("te", "తెలుగు", "🇮🇳"),
        LanguageOption("ta", "தமிழ்", "🇮🇳"),
        LanguageOption("gu", "ગુજરાતી", "🇮🇳"),
        LanguageOption("ur", "اردو", "🇮🇳"),
        LanguageOption("kn", "ಕನ್ನಡ", "🇮🇳"),
        LanguageOption("or", "ଓଡ଼ିଆ", "🇮🇳"),
        LanguageOption("ml", "മലയാളം", "🇮🇳"),
        LanguageOption("as", "অসমীয়া", "🇮🇳")
    )

    var currentLanguageCode by mutableStateOf("en")

    fun init(context: Context) {
        val prefs = context.getSharedPreferences("buywise_user_prefs", Context.MODE_PRIVATE)
        val savedCode = prefs.getString("saved_language_code", null)
        if (!savedCode.isNullOrEmpty()) {
            currentLanguageCode = savedCode
        }
    }

    fun setLanguage(context: Context, code: String) {
        currentLanguageCode = code
        val prefs = context.getSharedPreferences("buywise_user_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("saved_language_code", code).apply()
    }

    fun cycleNextLanguage(context: Context): String {
        val nextCode = when (currentLanguageCode) {
            "en" -> "hi"
            "hi" -> "hi-en"
            else -> "en"
        }
        setLanguage(context, nextCode)
        return nextCode
    }

    var activeLanguage: BuyWiseLanguage
        get() = BuyWiseLanguage.fromCode(currentLanguageCode)
        set(value) {
            currentLanguageCode = value.code
        }

    private val translations: Map<String, Map<String, String>> = mapOf(
        "hi_maya" to mapOf(
            "en" to "Hi Maya! 👋",
            "hi" to "नमस्ते माया! 👋",
            "hi-en" to "Hi Maya! 👋"
        ),
        "online_status" to mapOf(
            "en" to "• Online & ready to assist",
            "hi" to "• ऑनलाइन और सहायता के लिए तैयार",
            "hi-en" to "• Online & ready to assist"
        ),
        "ask_ai_assistant" to mapOf(
            "en" to "Ask Maya anything...",
            "hi" to "माया से कुछ भी पूछें...",
            "hi-en" to "Maya se kuch bhi poochho..."
        ),
        "find_best_deal" to mapOf(
            "en" to "Find Best Deals",
            "hi" to "सर्वश्रेष्ठ डील खोजें",
            "hi-en" to "Best Deals Dhoondho"
        ),
        "compare_prices" to mapOf(
            "en" to "Compare Prices",
            "hi" to "कीमतों की तुलना करें",
            "hi-en" to "Price Compare Karo"
        ),
        "listening" to mapOf(
            "en" to "Listening...",
            "hi" to "सुन रहे हैं...",
            "hi-en" to "Sun rahe hain..."
        ),
        "searching" to mapOf(
            "en" to "Searching...",
            "hi" to "खोज रहे हैं...",
            "hi-en" to "Dhoondh rahe hain..."
        ),
        "speak_clearly_mic" to mapOf(
            "en" to "Speak clearly into the microphone",
            "hi" to "माइक्रोफ़ोन में स्पष्ट रूप से बोलें",
            "hi-en" to "Microphone mein saaf bolen"
        ),
        "lowest_price" to mapOf(
            "en" to "Lowest Price",
            "hi" to "न्यूनतम मूल्य",
            "hi-en" to "Lowest Price"
        ),
        "max_savings" to mapOf(
            "en" to "Max Savings",
            "hi" to "अधिकतम बचत",
            "hi-en" to "Max Savings"
        ),
        "stores_checked" to mapOf(
            "en" to "Stores Checked",
            "hi" to "जांचे गए स्टोर्स",
            "hi-en" to "Stores Checked"
        ),
        "compare_btn" to mapOf(
            "en" to "COMPARE",
            "hi" to "तुलना करें",
            "hi-en" to "COMPARE"
        ),
        "search_placeholder" to mapOf(
            "en" to "Search product or paste URL...",
            "hi" to "उत्पाद खोजें या यूआरएल पेस्ट करें...",
            "hi-en" to "Product search karein ya URL paste karein..."
        ),
        "try_again" to mapOf(
            "en" to "TRY AGAIN",
            "hi" to "पुनः प्रयास करें",
            "hi-en" to "TRY AGAIN"
        ),
        "cancel" to mapOf(
            "en" to "CANCEL",
            "hi" to "रद्द करें",
            "hi-en" to "CANCEL"
        ),
        "mic_perm_denied" to mapOf(
            "en" to "Microphone permission is required for voice search.",
            "hi" to "वॉयस सर्च के लिए माइक्रोफ़ोन अनुमति आवश्यक है।",
            "hi-en" to "Voice search ke liye microphone permission zaroori hai."
        ),
        "no_speech_detected" to mapOf(
            "en" to "No speech detected. Please try again.",
            "hi" to "कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।",
            "hi-en" to "Koi aawaaz nahi mili. Phir se try karein."
        ),
        "profile_title" to mapOf(
            "en" to "My Profile",
            "hi" to "मेरी प्रोफ़ाइल",
            "hi-en" to "My Profile"
        ),
        "app_tagline" to mapOf(
            "en" to "Shop Smarter. Buy Better.",
            "hi" to "स्मार्ट खरीदारी। बेहतर निर्णय।",
            "hi-en" to "Shop Smarter. Buy Better.",
            "pa" to "ਸਮਾਰਟ ਖਰੀਦਦਾਰੀ। ਵਧੀਆ ਫੈਸਲੇ।",
            "bn" to "স্মার্ট কেনাকাটা। উন্নত সিদ্ধান্ত।",
            "mr" to "स्मार्ट खरेदी। उत्तम निर्णय।",
            "te" to "స్మార్ట్ షాపింగ్. మెరుగైన కొనుగోలు.",
            "ta" to "ஸ்மார்ட் ஷாப்பிங். சிறந்த தேர்வு.",
            "gu" to "સ્માર્ટ ખરીદી. શ્રેષ્ઠ નિર્ણય.",
            "ur" to "اسمارٹ خریداری۔ بہتر فیصلے۔",
            "kn" to "ಸ್ಮಾರ್ಟ್ ಶಾಪಿಂಗ್. ಉತ್ತಮ ಖರೀದಿ.",
            "or" to "ସମାର୍ଟ କିଣାକିଣି | ଉତ୍ତମ ନିଷ୍ପତ୍ତି |",
            "ml" to "സ്മാർട്ട് ഷോപ്പിംഗ്. മികച്ച തീരുമാനങ്ങൾ.",
            "as" to "স্মাৰ্ট ক্ৰয়। উন্নত সিদ্ধান্ত।"
        ),
        "see_compare_try_save_buy" to mapOf(
            "en" to "SEE ➔ COMPARE ➔ TRY ON ➔ SAVE ➔ BUY",
            "hi" to "देखो ➔ तुलना करो ➔ ट्राई करो ➔ बचाओ ➔ खरीदो",
            "hi-en" to "SEE ➔ COMPARE ➔ TRY ON ➔ SAVE ➔ BUY",
            "pa" to "ਵੇਖੋ ➔ ਤੁਲਨਾ ਕਰੋ ➔ ਟਰਾਈ ਕਰੋ ➔ ਬਚਾਓ ➔ ਖਰੀਦੋ",
            "bn" to "দেখুন ➔ তুলনা করুন ➔ ট্রাই করুন ➔ বাঁচান ➔ কিনুন",
            "mr" to "पहा ➔ तुलना करा ➔ ट्राय करा ➔ वाचवा ➔ खरेदी करा",
            "te" to "చూడండి ➔ పోల్చండి ➔ ట్రై చేయండి ➔ పొదుపు చేయండి ➔ కొనండి",
            "ta" to "பாருங்கள் ➔ ஒப்பிடுங்கள் ➔ ட்ரை செய்யுங்கள் ➔ சேமிக்கவும் ➔ வாங்குங்கள்",
            "gu" to "જુઓ ➔ સરખામણી કરો ➔ ટ્રાય કરો ➔ બચાવો ➔ ખરીદો",
            "ur" to "دیکھیں ➔ موازنہ کریں ➔ ٹرائی کریں ➔ بچائیں ➔ خریدیں",
            "kn" to "ನೋಡಿ ➔ ಹೋಲಿಸಿ ➔ ಟ್ರೈ ಮಾಡಿ ➔ ಉಳಿಸಿ ➔ ખરીದಿಸಿ",
            "or" to "ଦେଖନ୍ତୁ ➔ ତୁଳନା କରନ୍ତୁ ➔ ଟ୍ରାଏ କରନ୍ତୁ ➔ ସଞ୍ଚୟ କରନ୍ତୁ ➔ କିଣନ୍ତୁ",
            "ml" to "കാണുക ➔ താരതമ്യം ചെയ്യുക ➔ ട്രൈ ചെയ്യുക ➔ സേവ് ചെയ്യുക ➔ വാങ്ങുക",
            "as" to "সাওক ➔ তুলনা কৰক ➔ ট্ৰাই কৰক ➔ সঞ্চয় কৰক ➔ কিনক"
        ),
        "pillar_see" to mapOf(
            "en" to "1. See", "hi" to "1. देखो", "hi-en" to "1. See", "pa" to "1. ਵੇਖੋ", "bn" to "1. দেখুন",
            "mr" to "1. पहा", "te" to "1. చూడండి", "ta" to "1. பாருங்கள்", "gu" to "1. જુઓ", "ur" to "1. دیکھیں",
            "kn" to "1. ನೋಡಿ", "or" to "1. ଦେଖନ୍ତୁ", "ml" to "1. കാണുക", "as" to "1. চাওক"
        ),
        "pillar_compare" to mapOf(
            "en" to "2. Compare", "hi" to "2. तुलना", "hi-en" to "2. Compare", "pa" to "2. ਤੁਲਨਾ", "bn" to "2. তুলনা",
            "mr" to "2. तुलना", "te" to "2. పోలిక", "ta" to "2. ஒப்பீடு", "gu" to "2. સરખામણી", "ur" to "2. موازنہ",
            "kn" to "2. ಹೋಲಿಕೆ", "or" to "2. ତୁଳନା", "ml" to "2. താരതമ്യം", "as" to "2. তুলনা"
        ),
        "pillar_try_on" to mapOf(
            "en" to "3. Try On", "hi" to "3. ट्राई-ऑन", "hi-en" to "3. Trial Room", "pa" to "3. ਟਰਾਈ-ਆਨ", "bn" to "3. ট্রাই-অন",
            "mr" to "3. ट्राय-ऑन", "te" to "3. ట్రై-ఆన్", "ta" to "3. ட்ரை-ஆன்", "gu" to "3. ટ્રાય-ઓન", "ur" to "3. ٹرائی آن",
            "kn" to "3. ಟ್ರೈ-ಆನ್", "or" to "3. ଟ୍ରାଏ-ଅନ୍", "ml" to "3. ട്രൈ-ഓൺ", "as" to "3. ট্ৰাই-অন"
        ),
        "pillar_save" to mapOf(
            "en" to "4. Save", "hi" to "4. बचत", "hi-en" to "4. Save", "pa" to "4. ਬਚਤ", "bn" to "4. সঞ্চয়",
            "mr" to "4. बचत", "te" to "4. పొదుపు", "ta" to "4. சேமிப்பு", "gu" to "4. બચત", "ur" to "4. بچت",
            "kn" to "4. ಉಳಿತಾಯ", "or" to "4. ସଞ୍ଚୟ", "ml" to "4. സേവിംഗ്സ്", "as" to "4. সঞ্চয়"
        ),
        "pillar_buy" to mapOf(
            "en" to "5. Buy Wisely", "hi" to "5. समझदारी से खरीदें", "hi-en" to "5. Buy Wisely", "pa" to "5. ਖਰੀਦੋ", "bn" to "5. বুদ্ধিমানের সাথে কিনুন",
            "mr" to "5. समजदारीने खरेदी करा", "te" to "5. తెలివిగా కొనండి", "ta" to "5. புத்திசாலித்தனமாக வாங்குங்கள்", "gu" to "5. ખરીદો", "ur" to "5. دانشمندی سے خریدیں",
            "kn" to "5. ಜಾಣತನದಿಂದ ખરીದಿಸಿ", "or" to "5. ଚତୁରତାର ସହ କିଣନ୍ତୁ", "ml" to "5. ബുദ്ധിപൂർവ്വം വാങ്ങുക", "as" to "5. বুদ্ধিৰে কিনক"
        ),
        "compare_it" to mapOf(
            "en" to "COMPARE IT", "hi" to "तुलना करें", "hi-en" to "COMPARE IT", "pa" to "ਤੁਲਨਾ ਕਰੋ", "bn" to "তুলনা করুন",
            "mr" to "तुलना करा", "te" to "పోల్చండి", "ta" to "ஒப்பிடுக", "gu" to "સરખામણી કરો", "ur" to "موازنہ کریں",
            "kn" to "ಹೋಲಿಸಿ", "or" to "ତୁଳନା କରନ୍ତୁ", "ml" to "താരതമ്യം ചെയ്യുക", "as" to "তুলনা কৰক"
        ),
        "multi_store_engine" to mapOf(
            "en" to "Multi-Store Price Engine", "hi" to "मल्टी-स्टोर मूल्य इंजन", "hi-en" to "Multi-Store Price Engine", "pa" to "ਮਲਟੀ-ਸਟੋਰ ਕੀਮਤ ਇੰਜਣ", "bn" to "মাল্টি-স্টোর প্রাইস ইঞ্জিন",
            "mr" to "मल्टी-स्टोर प्राइस इंजिन", "te" to "మల్టీ-స్టోర్ ప్రైస్ ఇంజిన్", "ta" to "மல்டி-ஸ்டோர் விலை இன்ஜின்", "gu" to "મલ્ટિ-સ્ટોર કિંમત એન્જિન", "ur" to "ملٹی اسٹور پرائس انجن",
            "kn" to "ಮಲ್ಟಿ-ಸ್ಟೋರ್ ಬೆಲೆ ಇಂಜಿನ್", "or" to "ମଲ୍ଟି-ଷ୍ଟୋର ମୂଲ୍ୟ ଇଞ୍ଜିନ୍", "ml" to "മൾട്ടി-സ്റ്റോർ പ്രൈസ് എൻജിൻ", "as" to "মাল্টি-ষ্ট'ৰ মূল্য ইঞ্জিন"
        ),
        "multi_store_desc" to mapOf(
            "en" to "Search & compare live prices across Amazon, Flipkart, Meesho, Myntra, Nykaa, AJIO, Tata CLiQ, Etsy, eBay, and 2,500+ stores.",
            "hi" to "एमेज़ॉन, फ़्लिपकार्ट, मीशो, मिंत्रा, नायका और 2,500+ स्टोर पर लाइव कीमतों की तुलना करें।",
            "hi-en" to "Search & compare live prices across Amazon, Flipkart, Meesho, Myntra, Nykaa, AJIO, Tata CLiQ, Etsy, eBay, and 2,500+ stores.",
            "pa" to "ਐਮਾਜ਼ਾਨ, ਫਲਿੱਪਕਾਰਟ, ਮੀਸ਼ੋ, ਮਿੰਤਰਾ ਅਤੇ 2,500+ ਸਟੋਰਾਂ ਵਿੱਚ ਲਾਈਵ ਕੀਮਤਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ।",
            "bn" to "আমাজন, ফ্লিপকার্ট, মিশো, মিন্ত্রা এবং ২,৫০০+ স্টোরে তাজা দর তুলনা করুন।",
            "mr" to "अमेझॉन, फ्लिपकार्ट, मीशो, मिंत्रा आणि २,५००+ स्टोअर्सवर थेट किमतींची तुलना करा.",
            "te" to "అమెజాన్, ఫ్లిప్‌కార్ట్, మీషో, మైంత్రా మరియు 2,500+ స్టోర్లలో లైవ్ ధరలను పోల్చండి.",
            "ta" to "அமேசான், பிளிப்கார்ட், மீஷோ, மைண்ட்ரா மற்றும் 2,500+ கடைகளில் நேரலை விலைகளை ஒப்பிடுக.",
            "gu" to "એમેઝોન, ફ્લિપકાર્ટ, મીશ્રો, મિંત્રા અને 2,500+ સ્ટોર્સ પર લાઇવ કિંમતોની સરખામણી કરો.",
            "ur" to "ایمیزون، فلپ کارٹ، میشو اور 2,500+ اسٹورز پر لائیو قیمتوں کا موازنہ کریں۔",
            "kn" to "ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್, ಮೀಶೋ ಮತ್ತು 2,500+ ಅಂಗಡಿಗಳಲ್ಲಿ ಲೈವ್ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ.",
            "or" to "ଆମାଜନ୍, ଫ୍ଲିପକାର୍ଟ, ମିଶୋ ଏବଂ ୨,୫୦୦+ ଷ୍ଟୋରରେ ଲାଇଭ୍ ମୂଲ୍ୟ ତୁଳନା କରନ୍ତୁ |",
            "ml" to "ആമസോൺ, ഫ്ലിപ്കാർട്ട്, മീഷോ എന്നിവയിലുടനീളം തത്സമയ വിലകൾ താരതമ്യം ചെയ്യുക.",
            "as" to "আমাজন, ফ্লিপকাৰ্ট, মিছো আৰু ২,৫০০+ ষ্ট'ৰত প্ৰত্যক্ষ মূল্য তুলনা কৰক।"
        ),
        "compare_stores_now" to mapOf(
            "en" to "Compare Stores Now ➔", "hi" to "अभी स्टोर्स की तुलना करें ➔", "hi-en" to "Compare Stores Now ➔", "pa" to "ਹੁਣੇ ਸਟੋਰਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ ➔", "bn" to "এখনই স্টোর তুলনা করুন ➔",
            "mr" to "आत्ताच स्टोअर्सची तुलना करा ➔", "te" to "ఇప్పుడే స్టోర్లను పోల్చండి ➔", "ta" to "இப்போது கடைகளை ஒப்பிடுக ➔", "gu" to "હવે સ્ટોર્સની સરખામણી કરો ➔", "ur" to "ابھی اسٹورز کا موازنہ کریں ➔",
            "kn" to "ಈಗ ಅಂಗಡಿಗಳನ್ನು ಹೋಲಿಸಿ ➔", "or" to "ବର୍ତ୍ତମାନ ଷ୍ଟୋରଗୁଡିକ ତୁଳନା କରନ୍ତୁ ➔", "ml" to "ഇപ്പോൾ സ്റ്റോറുകൾ താരതമ്യം ചെയ്യുക ➔", "as" to "এতিয়াই ষ্ট'ৰ তুলনা কৰক ➔"
        ),
        "try_it_on" to mapOf(
            "en" to "TRY IT ON", "hi" to "ट्राई करें", "hi-en" to "TRY IT ON", "pa" to "ਟਰਾਈ ਕਰੋ", "bn" to "ট্রাই করুন",
            "mr" to "ट्राय करा", "te" to "ట్రై చేయండి", "ta" to "ட்ரை செய்யுங்கள்", "gu" to "ટ્રાય કરો", "ur" to "ٹرائی کریں",
            "kn" to "ಟ್ರೈ ಮಾಡಿ", "or" to "ଟ୍ରାଏ କରନ୍ତୁ", "ml" to "ട്രൈ ചെയ്യുക", "as" to "ট্ৰাই কৰক"
        ),
        "ai_virtual_trial_room" to mapOf(
            "en" to "AI Virtual Trial Room", "hi" to "एआई वर्चुअल ट्रायल रूम", "hi-en" to "AI Virtual Trial Room", "pa" to "AI ਵਰਚੁਅਲ ਟਰਾਈਲ ਰੂਮ", "bn" to "এআই ভার্চুয়াল ট্রায়াল রুম",
            "mr" to "AI व्हर्च्युअल चाचणी कक्ष", "te" to "AI వర్చువల్ ట్రయల్ రూమ్", "ta" to "AI விர்ச்சுவல் ட்ரையல் ரூம்", "gu" to "AI વર્ચ્યુઅલ ટ્રાયલ રૂમ", "ur" to "AI ورچوئل ٹرائل روم",
            "kn" to "AI ವರ್ಚುವಲ್ ಟ್ರಯಲ್ ರೂಮ್", "or" to "AI ଭର୍ଚୁଆଲ୍ ଟ୍ରାଏଲ୍ ରୁମ୍", "ml" to "AI വെർച്വൽ ട്രയൽ റൂം", "as" to "AI ভাৰ্চুৱেল ট্ৰায়েল ৰুম"
        ),
        "virtual_trial_desc" to mapOf(
            "en" to "Upload your photo or paste product links from Myntra, Amazon, Nykaa or Etsy to see yourself wearing sarees, dresses, or innerwear before buying.",
            "hi" to "खरीदने से पहले साड़ी, कपड़े या ज्वेलरी में अपना लुक देखने के लिए अपना फोटो अपलोड करें।",
            "hi-en" to "Upload your photo or paste product links from Myntra, Amazon, Nykaa or Etsy to see yourself wearing sarees, dresses, or innerwear before buying.",
            "pa" to "ਖਰੀਦਣ ਤੋਂ ਪਹਿਲਾਂ ਸਾੜ੍ਹੀ ਜਾਂ ਕੱਪੜਿਆਂ ਵਿੱਚ ਆਪਣੀ ਦਿਖ ਦੇਖਣ ਲਈ ਆਪਣੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।",
            "bn" to "কেনার আগে শাড়ি, পোশাক বা গহনায় নিজের চেহারা দেখতে আপনার ছবি আপলোড করুন।",
            "mr" to "खरेदी करण्यापूर्वी साडी किंवा कपड्यांमध्ये स्वतःचे रूप पाहण्यासाठी तुमचा फोटो अपलोड करा.",
            "te" to "కొనేముందు చీరలు లేదా దుస్తులలో మిమ్మల్ని మీరు చూసుకోవడానికి మీ ఫోటోను అప్‌లోడ్ చేయండి.",
            "ta" to "வாங்குவதற்கு முன் புடவைகள் அல்லது ஆடைகளில் உங்களைப் பார்க்க உங்கள் புகைப்படத்தைப் பதிவேற்றவும்.",
            "gu" to "ખરીદતા પહેલા સાડી કે કપડાંમાં તમારો દેખાવ જોવા માટે તમારો ફોટો અપલોડ કરો.",
            "ur" to "خریدنے سے پہلے ساڑی یا کپڑوں میں اپنی شکل دیکھنے کے لیے اپنی تصویر اپ لوڈ کریں۔",
            "kn" to "ಖರೀದಿಸುವ ಮೊದಲು ಸೀರೆ ಅಥವಾ ಉಡುಪುಗಳಲ್ಲಿ ನಿಮ್ಮ ನೋಟವನ್ನು ನೋಡಲು ನಿಮ್ಮ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
            "or" to "କିଣିବା ପୂର୍ବରୁ ଶାଢୀ କିମ୍ବା ପୋଷାକରେ ନିଜର ଲୁକ୍ ଦେଖିବା ପାଇଁ ଆପଣଙ୍କର ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ |",
            "ml" to "വാങ്ങുന്നതിനുമുമ്പ് സാരികളിലോ വസ്ത്രങ്ങളിലോ നിങ്ങളുടെ ലുക്ക് കാണാൻ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.",
            "as" to "কিনাৰ পূৰ্বে শাৰী বা কাপোৰত নিজৰ ছবি চাবলৈ আপোনাৰ ফটো আপলোড কৰক।"
        ),
        "open_ai_trial_room" to mapOf(
            "en" to "Open AI Trial Room ➔", "hi" to "एआई ट्रायल रूम खोलें ➔", "hi-en" to "Open AI Trial Room ➔", "pa" to "AI ਟਰਾਈਲ ਰੂਮ ਖੋਲ੍ਹੋ ➔", "bn" to "এআই ট্রায়াল রুম খুলুন ➔",
            "mr" to "AI चाचणी कक्ष उघडा ➔", "te" to "AI ట్రయల్ రూమ్ తెరవండి ➔", "ta" to "AI ட்ரையல் ரூமை திறக்கவும் ➔", "gu" to "AI ટ્રાયલ રૂમ ખોલો ➔", "ur" to "AI ٹرائل روم کھولیں ➔",
            "kn" to "AI ಟ್ರಯಲ್ ರೂಮ್ ತೆರೆಯಿರಿ ➔", "or" to "AI ଟ୍ରାଏଲ୍ ରୁମ୍ ଖୋଲନ୍ତୁ ➔", "ml" to "AI ട്രയൽ റൂം തുറക്കുക ➔", "as" to "AI ট্ৰায়েল ৰুম খোলক ➔"
        ),
        "save_and_buy" to mapOf(
            "en" to "SAVE & BUY", "hi" to "बचत और खरीदारी", "hi-en" to "SAVE & BUY", "pa" to "ਬਚਤ ਅਤੇ ਖਰੀਦੋ", "bn" to "সঞ্চয় ও ক্রয়",
            "mr" to "बचत आणि खरेदी", "te" to "పొదుపు & కొనుగోలు", "ta" to "சேமிப்பு & வாங்குதல்", "gu" to "બચત અને ખરીદો", "ur" to "بچت اور خریداری",
            "kn" to "ಉಳಿತಾಯ ಮತ್ತು ಖರೀದಿ", "or" to "ସଞ୍ଚୟ ଏବଂ କ୍ରୟ", "ml" to "സേവിംഗ്സ് & പർച്ചേസ്", "as" to "সঞ্চয় আৰু ক্ৰয়"
        ),
        "real_effective_price" to mapOf(
            "en" to "Real Effective Price & Coupons", "hi" to "वास्तविक प्रभावी मूल्य और कूपन", "hi-en" to "Real Effective Price & Coupons", "pa" to "ਅਸਲ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਕੀਮਤ ਅਤੇ ਕੂਪਨ", "bn" to "প্রকৃত কার্যকর মূল্য ও কুপন",
            "mr" to "वास्तविक प्रभावी किंमत आणि कूपन", "te" to "నిజమైన సమర్థవంతమైన ధర & కూపన్లు", "ta" to "உண்மையான અસરකාරக விலை & கூப்பன்கள்", "gu" to "વાસ્તવિક અસરકારક કિંમત અને કૂપન્સ", "ur" to "حقیقی موثر قیمت اور کوپن",
            "kn" to "ನೈಜ ಪರಿಣಾಮಕಾರಿ ಬೆಲೆ ಮತ್ತು ಕೂಪನ್‌ಗಳು", "or" to "ପ୍ରକୃତ ପ୍ରଭାବଶାଳୀ ମୂଲ୍ୟ ଏବଂ କୁପନ୍", "ml" to "യഥാർത്ഥ ഫലപ്രദമായ വിലയും കൂപ്പണുകളും", "as" to "প্ৰকৃত কাৰ্যকৰী মূল্য আৰু কুপন"
        ),
        "real_effective_desc" to mapOf(
            "en" to "Get 100% verified working coupons, stackable promo codes, and real effective price calculation (Listed Price - Coupon = Net Savings) before checkout.",
            "hi" to "चेकआउट से पहले 100% सत्यापित कूपन और वास्तविक बचत गणना प्राप्त करें।",
            "hi-en" to "Get 100% verified working coupons, stackable promo codes, and real effective price calculation (Listed Price - Coupon = Net Savings) before checkout.",
            "pa" to "ਚੈੱਕਆਉਟ ਤੋਂ ਪਹਿਲਾਂ 100% ਪ੍ਰਮਾਣਿਤ ਕੂਪਨ ਅਤੇ ਅਸਲ ਬਚਤ ਪ੍ਰਾਪਤ ਕਰੋ।",
            "bn" to "চেকআউটের আগে ১০০% যাচাইকৃত কুপন এবং আসল সঞ্চয় হিসাব পান।",
            "mr" to "चेकआउटपूर्वी १००% सत्यापित कूपन आणि वास्तव बचत मिळवा.",
            "te" to "చెక్‌అవుట్‌కు ముందు 100% ధృవీకరించబడిన కూపన్లు మరియు నిజమైన పొదుపులను పొందండి.",
            "ta" to "செக்அவுட்டிற்கு முன் 100% சரிபார்க்கப்பட்ட கூப்பன்கள் மற்றும் சேமிப்புகளைப் பெறுங்கள்.",
            "gu" to "ચેકઆઉટ પહેલાં 100% ચકાસાયેલ કૂપન્સ અને સાચી બચત મેળવો.",
            "ur" to "چیک آؤٹ سے پہلے 100% تصدیق شدہ کوپن اور حقیقی بچت حاصل کریں۔",
            "kn" to "ಚೆಕ್‌ಔಟ್‌ಗೆ ಮೊದಲು 100% ಪರಿಶೀಲಿಸಿದ ಕೂಪನ್‌ಗಳು ಮತ್ತು ಉಳಿತಾಯವನ್ನು ಪಡೆಯಿರಿ.",
            "or" to "ଚେକଆଉଟ୍ ପୂର୍ବରୁ ୧୦୦% ଯାଞ୍ଚ ହୋଇଥିବା କୁପନ୍ ଏବଂ ବାସ୍ତବ ସଞ୍ଚୟ ପାଆନ୍ତୁ |",
            "ml" to "ചെക്ക്ഔട്ടിന് മുമ്പ് 100% പരിശോധിച്ചുറപ്പിച്ച കൂപ്പണുകളും സമ്പാദ്യവും നേടുക.",
            "as" to "চেকআউটৰ পূৰ্বে ১০০% প্ৰমাণিত কুপন আৰু প্ৰকৃত সঞ্চয় লাভ কৰক।"
        ),
        "find_verified_coupons" to mapOf(
            "en" to "Find Verified Coupons ➔", "hi" to "सत्यापित कूपन खोजें ➔", "hi-en" to "Find Verified Coupons ➔", "pa" to "ਪ੍ਰਮਾਣਿਤ ਕੂਪਨ ਲੱਭੋ ➔", "bn" to "যাচাইকৃত কুপন খুঁজুন ➔",
            "mr" to "सत्यापित कूपन शोधा ➔", "te" to "ధృవీకరించబడిన కూపన్లను కనుగొనండి ➔", "ta" to "சரிபார்க்கப்பட்ட கூப்பன்களைக் கண்டறியவும் ➔", "gu" to "ચકાસાયેલ કૂપન્સ શોધો ➔", "ur" to "تصدیق شدہ کوپن تلاش کریں ➔",
            "kn" to "ಪರಿಶೀಲಿಸಿದ ಕೂಪನ್‌ಗಳನ್ನು ಹುಡುಕಿ ➔", "or" to "ଯାଞ୍ଚ ହୋଇଥିବା କୁପନ୍ ଖୋଜନ୍ତୁ ➔", "ml" to "പരിശോധിച്ച കൂപ്പണുകൾ കണ്ടെത്തുക ➔", "as" to "প্ৰমাণিত কুপন বিচাৰক ➔"
        ),
        "weekly_challenge_banner" to mapOf(
            "en" to "🏆 THIS WEEK'S BUYWISE CHALLENGE", "hi" to "🏆 इस सप्ताह का बायवाइज़ चैलेंज", "hi-en" to "🏆 THIS WEEK'S BUYWISE CHALLENGE", "pa" to "🏆 ਇਸ ਹਫ਼ਤੇ ਦਾ ਬਾਈਵਾਈਜ਼ ਚੈਲੇਂਜ", "bn" to "🏆 এই সপ্তাহের বাইওয়াইজ চ্যালেঞ্জ",
            "mr" to "🏆 या आठवड्याचे बायवाइझ चॅलेंज", "te" to "🏆 ఈ వారపు బైవైజ్ ఛాలెంజ్", "ta" to "🏆 இந்த வார பைவைஸ் சவால்", "gu" to "🏆 આ અઠવાડિયાનું બાયવાઇઝ ચેલેન્જ", "ur" to "🏆 اس ہفتے کا بائی وائز چیلنج",
            "kn" to "🏆 ಈ ವಾರದ ಬೈವೈಸ್ ಚಾಲೆಂಜ್", "or" to "🏆 ଏହି ସପ୍ତାହର ବାଏୱାଇଜ୍ ଚ୍ୟାଲେଞ୍ଜ", "ml" to "🏆 ഈ ആഴ്ചയിലെ ബൈവൈസ് ചലഞ്ച്", "as" to "🏆 এই সপ্তাহৰ বাইৱাইজ চেলেঞ্জ"
        ),
        "free_entry" to mapOf(
            "en" to "🆓 Free Entry", "hi" to "🆓 मुफ़्त प्रवेश", "hi-en" to "🆓 Free Entry", "pa" to "🆓 ਮੁਫ਼ਤ ਐਂਟਰੀ", "bn" to "🆓 বিনামূল্যে প্রবেশ",
            "mr" to "🆓 मोफत प्रवेश", "te" to "🆓 ఉచిత ఎంట్రీ", "ta" to "🆓 இலவச நுழைவு", "gu" to "🆓 મફત પ્રવેશ", "ur" to "🆓 مفت انٹری",
            "kn" to "🆓 ಉಚಿತ ಎಂಟ್ರಿ", "or" to "🆓 ମାଗଣା ପ୍ରବେଶ", "ml" to "🆓 സൗജന്യ പ്രവേശനം", "as" to "🆓 বিনামূলীয়া প্ৰৱেশ"
        ),
        "featured_label" to mapOf(
            "en" to "Featured", "hi" to "विशेष", "hi-en" to "Featured", "pa" to "ਖਾਸ", "bn" to "বিশেষ",
            "mr" to "खास", "te" to "ప్రత్యేకించబడినవి", "ta" to "சிறப்பம்சமாக", "gu" to "ખાસ", "ur" to "خاص",
            "kn" to "ವಿಶೇಷ", "or" to "ସ୍ୱତନ୍ତ୍ର", "ml" to "പ്രത്യേക താരം", "as" to "বিশেষ"
        ),
        "shop_by_category" to mapOf(
            "en" to "Shop by Category Bestsellers 🏆", "hi" to "श्रेणी के अनुसार बेस्टसेलर्स 🏆", "hi-en" to "Category ke hisaab se bestsellers 🏆", "pa" to "ਕੈਟੇਗਰੀ ਅਨੁਸਾਰ ਬੈਸਟਸੈਲਰ 🏆", "bn" to "ক্যাটাগরি অনুযায়ী সেরা বিক্রয় 🏆",
            "mr" to "वर्गानुसार सर्वोत्तम विक्री 🏆", "te" to "కేటగిరీ వారీగా ఉత్తమ విక్రయాలు 🏆", "ta" to "வகைப்பாடு வாரியாக சிறந்த விற்பனை 🏆", "gu" to "કેટેગરી મુજબ બેસ્ટસેલર્સ 🏆", "ur" to "کیٹیگری کے حساب سے بیسٹ سیلرز 🏆",
            "kn" to "ವರ್ಗಾವಾರು ಅತ್ಯುತ್ತມ ಮಾರಾಟ 🏆", "or" to "ବର୍ଗ ଅନୁଯାୟୀ ଶ୍ରେଷ୍ଠ ବିକ୍ରୟ 🏆", "ml" to "വിഭാഗം തിരിച്ച് മികച്ച വിൽപന 🏆", "as" to "শ্ৰেণী অনুসৰি শ্ৰেষ্ঠ বিক্ৰী 🏆"
        ),
        "cat_fashion" to mapOf(
            "en" to "Fashion & Clothing", "hi" to "फ़ैशन और कपड़े", "hi-en" to "Fashion & Clothes", "pa" to "ਫੈਸ਼ਨ ਅਤੇ ਕੱਪੜੇ", "bn" to "ফ্যাশন ও পোশাক",
            "mr" to "फॅशन आणि कपडे", "te" to "ఫ్యాషన్ & దుస్తులు", "ta" to "ஃபேஷன் & ஆடைகள்", "gu" to "ફેશન અને કપડાં", "ur" to "فیشن اور کپڑے",
            "kn" to "ಫ್ಯಾಷನ್ ಮತ್ತು ಉಡುಪು", "or" to "ଫ୍ୟାଶନ୍ ଏବଂ ପୋଷାକ", "ml" to "ഫാഷൻ & വസ്ത്രങ്ങൾ", "as" to "ফেশ্বন আৰু কাপোৰ"
        ),
        "cat_tech" to mapOf(
            "en" to "Mobiles & Tech", "hi" to "मोबाइल और टेक", "hi-en" to "Mobiles & Tech", "pa" to "ਮੋਬਾਈਲ ਅਤੇ ਟੈਕ", "bn" to "মোবাইল ও টেক",
            "mr" to "मोबाईल आणि टेक", "te" to "మొబైల్స్ & టెక్", "ta" to "மொபைல்கள் & ટેક્", "gu" to "મોબાઇલ અને ટેક", "ur" to "موبائل اور ٹیک",
            "kn" to "ಮೊಬೈಲ್ ಮತ್ತು ಟೆಕ್", "or" to "ମୋବାଇଲ୍ ଏବଂ ଟେକ୍", "ml" to "മൊബൈലുകൾ & ടെക്", "as" to "মোবাইল আৰু টেক"
        ),
        "cat_audio" to mapOf(
            "en" to "Audio & Gadgets", "hi" to "ऑडियो और गैजेट्स", "hi-en" to "Audio & Gadgets", "pa" to "ਆਡੀਓ ਅਤੇ ਗੈਜੇਟਸ", "bn" to "অডিও ও গ্যাজেট",
            "mr" to "ऑडिओ आणि गॅझेट्स", "te" to "ఆడియో & గ్యాడ్జెట్లు", "ta" to "ஆடியோ & கேஜெட்டுகள்", "gu" to "ઓડિયો અને ગેજેટ્સ", "ur" to "آڈیو اور گیجٹس",
            "kn" to "ಆಡಿಯೋ ಮತ್ತು ಗ್ಯಾಜೆಟ್‌ಗಳು", "or" to "ଅଡିଓ ଏବଂ ଗ୍ୟାଜେଟ୍", "ml" to "ഓഡിയോ & ഗാഡ്‌ജെറ്റുകൾ", "as" to "অডিঅ' আৰু গেজেট"
        ),
        "cat_beauty" to mapOf(
            "en" to "Beauty & Care", "hi" to "ब्यूटी और केयर", "hi-en" to "Beauty & Care", "pa" to "ਬਿਊਟੀ ਅਤੇ ਕੇਅਰ", "bn" to "বিউটি ও কেয়ার",
            "mr" to "ब्युटी आणि केअर", "te" to "బ్యూటీ & కేర్", "ta" to "பியூட்டி & கேர்", "gu" to "બ્યુટી અને કેર", "ur" to "بیوٹی اور کیئر",
            "kn" to "ಬ್ಯೂಟಿ ಮತ್ತು ಕೇರ್", "or" to "ବ୍ୟୁଟି ଏବଂ କେୟାର", "ml" to "ബ്യൂട്ടി & കെയർ", "as" to "বিউটি আৰু কেয়াৰ"
        ),
        "speak_listening" to mapOf(
            "en" to "🎙️ Speak now, we are listening...", "hi" to "🎙️ बोलिए, हम सुन रहे हैं...", "hi-en" to "🎙️ Bolo, hum sun rahe hain...", "pa" to "🎙️ ਬੋਲੋ, ਅਸੀਂ ਸੁਣ ਰਹੇ ਹਾਂ...", "bn" to "🎙️ বলুন, আমরা শুনছি...",
            "mr" to "🎙️ बोला, आम्ही ऐकत आहोत...", "te" to "🎙️ మాట్లాడండి, మేము వింటున్నాము...", "ta" to "🎙️ பேசுங்கள், நாங்கள் கேட்கிறோம்...", "gu" to "🎙️ બોલો, અમે સાંભળી રહ્યા છીએ...", "ur" to "🎙️ بولیں، ہم سن رہے ہیں...",
            "kn" to "🎙️ ಮಾತನಾಡಿ, ನಾವು ಕೇಳುತ್ತಿದ್ದೇವೆ...", "or" to "🎙️ କୁହନ୍ତୁ, ଆମେ ଶୁଣୁଛୁ...", "ml" to "🎙️ സംസാരിക്കൂ, ഞങ്ങൾ കേൾക്കുന്നു...", "as" to "🎙️ কওਕ, আমি শুনি আছোঁ..."
        ),
        "nav_home" to mapOf(
            "en" to "Home", "hi" to "होम", "hi-en" to "Home", "pa" to "ਹੋਮ", "bn" to "হোম",
            "mr" to "होम", "te" to "హోమ్", "ta" to "முகப்பு", "gu" to "હોમ", "ur" to "ہوم",
            "kn" to "ಹೋಮ್", "or" to "ହୋମ୍", "ml" to "ഹോം", "as" to "হোম"
        ),
        "nav_search" to mapOf(
            "en" to "SmartCompare", "hi" to "स्मार्ट तुलना", "hi-en" to "Compare", "pa" to "ਤੁਲਨਾ", "bn" to "স্মার্ট তুলনা",
            "mr" to "स्मार्ट तुलना", "te" to "స్మార్ట్ పోలిక", "ta" to "ஒப்பீடு", "gu" to "સરખામણી", "ur" to "موازنہ",
            "kn" to "ಹೋಲಿಕೆ", "or" to "ତୁଳନା", "ml" to "താരതമ്യം", "as" to "তুলনা"
        ),
        "nav_comp" to mapOf(
            "en" to "Challenge", "hi" to "चैलेंज", "hi-en" to "Challenge", "pa" to "ਚੈਲੇਂਜ", "bn" to "চ্যালেঞ্জ",
            "mr" to "चॅलेंज", "te" to "ఛాలెంజ్", "ta" to "சவால்", "gu" to "ચેલેન્જ", "ur" to "چیلنج",
            "kn" to "ಚಾಲೆಂಜ್", "or" to "ଚ୍ୟାଲେଞ୍ଜ", "ml" to "ചലഞ്ച്", "as" to "চেলেঞ্জ"
        ),
        "nav_vto" to mapOf(
            "en" to "Try-On", "hi" to "ट्राई-ऑन", "hi-en" to "Trial Room", "pa" to "ਟਰਾਈ-ਆਨ", "bn" to "ট্রাই-অন",
            "mr" to "ट्राय-ऑन", "te" to "ట్రై-ఆన్", "ta" to "ட்ரை-ஆன்", "gu" to "ટ્રાય-ઓન", "ur" to "ٹرائی آن",
            "kn" to "ಟ್ರೈ-ಆನ್", "or" to "ଟ୍ରାଏ-ଅନ୍", "ml" to "ട്രൈ-ഓൺ", "as" to "ট্ৰাই-অন"
        ),
        "nav_profile" to mapOf(
            "en" to "Profile", "hi" to "प्रोफ़ाइल", "hi-en" to "Profile", "pa" to "ਪ੍ਰੋਫਾਈਲ", "bn" to "প্রোফাইল",
            "mr" to "प्रोफाइल", "te" to "ప్రొఫైల్", "ta" to "சுயவிவரம்", "gu" to "પ્રોફાઇલ", "ur" to "پروفائل",
            "kn" to "ಪ್ರೊಫೈಲ್", "or" to "ପ୍ରୋଫାଇଲ୍", "ml" to "പ്രൊഫൈൽ", "as" to "প্ৰফাইল"
        ),
        "BuyWise Select" to mapOf(
            "en" to "BuyWise Select", "hi" to "बायवाइज़ सेलेक्ट", "hi-en" to "BuyWise Select", "pa" to "ਬਾਈਵਾਈਜ਼ ਸਿਲੈਕਟ", "bn" to "বাইওয়াইজ সিলেক্ট",
            "mr" to "बायवाइझ सिलेक्ट", "te" to "బైవైజ్ సెలెక్ట్", "ta" to "பைவைஸ் செலக்ட்", "gu" to "બાયવાઇઝ સિલેક્ટ", "ur" to "بائی وائز سلیکٹ",
            "kn" to "ಬೈವೈಸ್ ಸೆಲೆಕ್ಟ್", "or" to "ବାଏୱାଇଜ୍ ସିଲେକ୍ଟ", "ml" to "ബൈവൈസ് സെലക്ട്", "as" to "বাইৱাইজ চিলেক্ট"
        ),
        "Red Carpet Edit" to mapOf(
            "en" to "Red Carpet Edit", "hi" to "रेड कार्पेट एडिट", "hi-en" to "Red Carpet Edit", "pa" to "ਰੇਡ ਕਾਰਪੇਟ ਐਡਿਟ", "bn" to "রেড কার্পেট এডিট",
            "mr" to "रेड कार्पेट एडिट", "te" to "రెడ్ కార్పెట్ ఎడిట్", "ta" to "ரெட் கார்பெட் எடிட்", "gu" to "રેડ કાર્પેટ એડિટ", "ur" to "ریڈ کارپٹ ایڈٹ",
            "kn" to "ರೆಡ್ ಕಾರ್ಪೆಟ್ ಎಡಿಟ್", "or" to "ରେଡ୍ କାର୍ପେଟ୍ ଏଡିଟ୍", "ml" to "റെഡ് കാർപെറ്റ് എഡിറ്റ്", "as" to "ৰেড কাৰ্পেট এডিট"
        )
    )

    fun getString(key: String): String {
        val entry = translations[key]
        if (entry != null) {
            val valInCurrent = entry[currentLanguageCode]
            if (!valInCurrent.isNullOrBlank()) {
                return valInCurrent
            }
            val valInEnglish = entry["en"]
            if (!valInEnglish.isNullOrBlank()) {
                return valInEnglish
            }
        }
        val formatted = key.split("_").joinToString(" ") { word ->
            word.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
        return formatted
    }
}

private val String?.isNotBlank: Boolean get() = this != null && this.trim().isNotEmpty()

@Composable
fun tr(key: String): String {
    return LanguageManager.getString(key)
}
