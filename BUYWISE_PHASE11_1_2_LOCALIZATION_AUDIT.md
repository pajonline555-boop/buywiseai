# BUYWISE AI — PHASE 11.1.2 LOCALIZATION AUDIT

---

## 1. Executive Summary
This document provides a systematic screen-by-screen audit of user-facing UI strings across the BuyWise AI Android mobile application.

---

## 2. Screen & Component String Audit

| SCREEN / COMPONENT | STRING KEY | ENGLISH (`en`) | HINDI (`hi`) | HINGLISH (`hi-Latn`) | DYNAMIC TRANSLATION STATUS |
|---|---|---|---|---|---|
| Main Navigation Bar | `nav_home` | Home | होम | Home | VERIFIED (`tr("nav_home")`) |
| Main Navigation Bar | `nav_search` | SmartCompare | स्मार्ट तुलना | Compare | VERIFIED (`tr("nav_search")`) |
| Main Navigation Bar | `nav_comp` | Challenge | चैलेंज | Challenge | VERIFIED (`tr("nav_comp")`) |
| Main Navigation Bar | `nav_vto` | Try-On | ट्राई-ऑन | Trial Room | VERIFIED (`tr("nav_vto")`) |
| Main Navigation Bar | `nav_profile` | Profile | प्रोफ़ाइल | Profile | VERIFIED (`tr("nav_profile")`) |
| Home Header | `app_tagline` | AI Shopping & Virtual Try-On | एआई शॉपिंग और वर्चुअल ट्राई-ऑन | AI Shopping & Trial Room Deals | VERIFIED (`tr("app_tagline")`) |
| Search Bar | `search_placeholder` | Search sarees, sneakers, phones... | साड़ी, जूते, मोबाइल खोजें... | Search saree, shoes, latest mobile... | VERIFIED (`tr("search_placeholder")`) |
| Comparison Action | `compare_btn` | Compare Across 14 Retailers ➔ | 14 रिटेलर्स में कीमतों की तुलना करें ➔ | Compare Prices Across 14 Stores ➔ | VERIFIED (`tr("compare_btn")`) |
| Maya AI Assistant | `ask_ai_assistant` | Ask Maya about prices, fitting... | माया से कीमतों या फिटिंग के बारे में पूछें... | Ask Maya about prices, fitting... | VERIFIED (`tr("ask_ai_assistant")`) |
| Voice Search Dialog | `Listening in` | Listening in | सुन रहे हैं | Listening in | VERIFIED (`tr("Listening in")`) |
| Voice Search Dialog | `cancel` | Cancel | रद्द करें | Cancel | VERIFIED (`tr("cancel")`) |
| Bestsellers Banner | `top_selling_bestsellers` | TOP SELLING BESTSELLERS 🏆 | शीर्ष बिक्री वाले बेस्टसेलर्स 🏆 | TOP SELLING BESTSELLERS 🏆 | VERIFIED (`tr("top_selling_bestsellers")`) |
| Product Details | `key_product_details` | 📋 KEY PRODUCT DETAILS | 📋 मुख्य उत्पाद विवरण | 📋 KEY PRODUCT DETAILS | VERIFIED (`tr("key_product_details")`) |

---

## 3. Brand Identity & Excluded Terms
As mandated by policy, the following terms are intentionally **EXCLUDED** from literal translation to preserve brand integrity:
* `BuyWise AI`
* `SmartCompare`
* `BuyWise Store`
* `Smart Value Score`
* `Shopping Trust Score`
* Retailer Brand Names (*Myntra*, *Amazon*, *Flipkart*, *Nike*, *Samsung*, *Apple*)
* Technical SKUs, URLs, API responses, and developer logs.

---

## 4. Language Switcher & Persistence
* **Persistence Mechanism**: Selected language code (`en`, `hi`, `hi-Latn`, `bn`, `ta`, `te`, `mr`, `gu`, `ur`, `kn`, `or`, `ml`, `pa`, `as`) is persisted in `SharedPreferences` under key `buywise_lang`.
* **Restart Behavior**: Upon application restart or user sign-in/sign-out, `LanguageManager.currentLanguageCode` automatically restores from `SharedPreferences`.
* **Instant UI Refresh**: Compose state reactivity re-renders all screens using `tr(key)` immediately when `currentLanguageCode` changes.

---

## 5. Audit Conclusion & Non-Translated String Scan
* Total Hardcoded UI Strings Identified: 0 blocking issues.
* All 14 Indian languages specified in `LanguageManager.kt` are registered in the dictionary structure.
