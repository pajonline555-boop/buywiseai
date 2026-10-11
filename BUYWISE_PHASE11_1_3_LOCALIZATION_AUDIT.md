# BUYWISE AI — PHASE 11.1.3 LOCALIZATION AUDIT

---

## 1. Executive Summary & Audit Coverage
This localization audit documents the complete screen-by-screen translation inventory across the BuyWise AI Android mobile application for English (`en`), Hindi (`hi`), and Hinglish (`hi-en`).

---

## 2. Complete UI Translation Key Registry

| KEY | ENGLISH (`en`) | HINDI (`hi`) | HINGLISH (`hi-en`) | AUDIT STATUS |
|---|---|---|---|---|
| `nav_home` | Home | होम | Home | **VERIFIED** |
| `nav_search` | SmartCompare | स्मार्ट तुलना | Compare | **VERIFIED** |
| `nav_comp` | Challenge | चैलेंज | Challenge | **VERIFIED** |
| `nav_vto` | Try-On | ट्राई-ऑन | Trial Room | **VERIFIED** |
| `nav_profile` | Profile | प्रोफ़ाइल | Profile | **VERIFIED** |
| `app_tagline` | AI Shopping & Virtual Try-On | एआई शॉपिंग और वर्चुअल ट्राई-ऑन | AI Shopping & Trial Room Deals | **VERIFIED** |
| `search_placeholder` | Search sarees, sneakers, phones... | साड़ी, जूते, मोबाइल खोजें... | Search saree, shoes, latest mobile... | **VERIFIED** |
| `compare_btn` | Compare Across 14 Retailers ➔ | 14 रिटेलर्स में कीमतों की तुलना करें ➔ | Compare Prices Across 14 Stores ➔ | **VERIFIED** |
| `smart_compare_engine` | SmartCompare Live Search Engine | स्मार्ट तुलना लाइव सर्च इंजन | SmartCompare Live Search Engine | **VERIFIED** |
| `ai_trial_room` | ✨ AI Trial Room | ✨ एआई ट्रायल रूम | ✨ AI Trial Room | **VERIFIED** |
| `weekly_challenge_banner` | 🏆 THIS WEEK'S BUYWISE CHALLENGE | 🏆 इस सप्ताह का बायवाइज़ चैलेंज | 🏆 THIS WEEK'S BUYWISE CHALLENGE | **VERIFIED** |
| `free_entry` | 🆓 Free Entry | 🆓 निःशुल्क प्रवेश | 🆓 Free Entry | **VERIFIED** |
| `shop_by_category` | Shop by Category Bestsellers 🏆 | श्रेणी के अनुसार बेस्टसेलर्स 🏆 | Category ke hisaab se bestsellers 🏆 | **VERIFIED** |
| `cat_fashion` | Fashion & Clothing | फ़ैशन और कपड़े | Fashion & Clothes | **VERIFIED** |
| `cat_tech` | Mobiles & Tech | मोबाइल और टेक | Mobiles & Tech | **VERIFIED** |
| `cat_audio` | Audio & Gadgets | ऑडियो और गैजेट्स | Audio & Gadgets | **VERIFIED** |
| `cat_beauty` | Beauty & Care | ब्यूटी और केयर | Beauty & Care | **VERIFIED** |
| `trending_comparisons` | Trending Comparisons 🔥 | ट्रेंडिंग तुलनाएँ 🔥 | Trending Comparisons 🔥 | **VERIFIED** |
| `supported_retailers` | Supported Retailers in India 🇮🇳 | भारत में समर्थित रिटेलर्स 🇮🇳 | Supported Retailers in India 🇮🇳 | **VERIFIED** |
| `our_recommendation` | OUR RECOMMENDATION | हमारी सिफ़ारिश | OUR RECOMMENDATION | **VERIFIED** |
| `speak_clearly_mic` | Speak clearly into your microphone... | अपने माइक्रोफ़ोन में स्पष्ट रूप से बोलें... | Apne mic mein saaf bolo... | **VERIFIED** |
| `try_again` | TRY AGAIN | पुनः प्रयास करें | PHIR SE TRY KARO | **VERIFIED** |
| `mic_perm_denied` | Microphone permission is required for voice search. | वॉइस सर्च के लिए माइक्रोफ़ोन की अनुमति आवश्यक है। | Voice search ke liye microphone permission chahiye. | **VERIFIED** |
| `no_speech_detected` | I couldn't hear you. Please try again. | आपकी आवाज़ सुनाई नहीं दी। कृपया पुनः प्रयास करें। | Awaaz sunai nahi di. Phir se bolo. | **VERIFIED** |
| `lowest_price` | LOWEST PRICE | सबसे कम कीमत | SABSE KAM PRICE | **VERIFIED** |
| `max_savings` | MAX SAVINGS | अधिकतम बचत | MAXIMUM SAVINGS | **VERIFIED** |
| `stores_checked` | STORES CHECKED | जाँचे गए स्टोर | STORES CHECKED | **VERIFIED** |
| `profile_title` | Profile & Settings | प्रोफ़ाइल और सेटिंग्स | Profile & Settings | **VERIFIED** |
| `hi_maya` | Hi Maya! 👋 | नमस्ते माया! 👋 | Hi Maya! 👋 | **VERIFIED** |
| `online_status` | Online • Shopping & Fashion Stylist 🟢 | ऑनलाइन • शॉपिंग और फ़ैशन स्टाइलिस्ट 🟢 | Online • Shopping & Fashion Stylist 🟢 | **VERIFIED** |

---

## 3. Screen-by-Screen Hardcoded String Audit Results

1. **Home Screen (`HomeScreen.kt`)**: 100% wired via `tr(...)`. Hardcoded labels replaced.
2. **Search Screen (`SearchScreen.kt`)**: 100% wired via `tr(...)`. Metric headers & status messages localized.
3. **Maya Assistant (`AiAssistantBottomSheet.kt`)**: Greeting, input placeholder, and quick prompt pills localized.
4. **Profile Screen (`ProfileScreen.kt`)**: Header, menu options, and settings localized.
5. **Brand / SKUs Excluded**: Product titles, SKU numbers, brand names (*BuyWise AI*, *SmartCompare*, *Amazon*, *Myntra*, *Flipkart*) remain intact.
