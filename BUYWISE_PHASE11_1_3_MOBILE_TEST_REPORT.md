# BUYWISE AI — PHASE 11.1.3 MOBILE TEST REPORT

---

## 1. Physical Device Specification
* **Device ID**: `926dbc44`
* **Device Type**: Connected Physical Android Smartphone
* **Target OS / SDK**: Android 15 (API Level 35)
* **Application Package**: `com.pajonline.buywiseai`

---

## 2. Targeted Acceptance Test Results

### A. 🎙️ Native Microphone / Voice Search Test
| TEST SCENARIO | INPUT / ACTION | EXPECTED BEHAVIOR | PHYSICAL DEVICE RESULT | STATUS |
|---|---|---|---|---|
| **English Voice** | Spoke: *"black Nike running shoes under five thousand"* | Permission granted -> Recognizes query -> Populates search bar -> Executes SmartCompare | Recognized: `"black Nike running shoes under five thousand"` -> 14 stores compared | **PASS** |
| **Hindi Voice** | Spoke: *"पाँच हजार के अंदर लाल साड़ी"* | Permission granted -> Recognizes Hindi speech (`hi-IN`) -> SmartCompare query parser | Recognized: `"पाँच हजार के अंदर लाल साड़ी"` -> Saree deal matrix generated | **PASS** |
| **Hinglish Voice** | Spoke: *"red saree teen hazaar ke andar"* | Permission granted -> Recognizes mixed Indian English/Hindi speech -> SmartCompare parser | Recognized: `"red saree teen hazaar ke andar"` -> Results generated | **PASS** |
| **Permission Denied** | Denied `RECORD_AUDIO` permission | Displays localized permission explanation without crashing | Localized notice shown: *"Microphone permission is required for voice search."* | **PASS** |
| **No Speech / Timeout** | Mic opened, silence for 5s | Clean error handling with retry option | Shows: *"I couldn't hear you. Please try again."* | **PASS** |

### B. 🤖 Maya AI Assistant Mobile Presentation Test
| TEST SCENARIO | INPUT / ACTION | EXPECTED BEHAVIOR | PHYSICAL DEVICE RESULT | STATUS |
|---|---|---|---|---|
| **Bottom-Right Launcher** | Inspected home screen bottom-right | Floating circular Maya button anchored at `Alignment.BottomEnd` above bottom nav | Floating 60.dp Maya avatar visible at bottom-right with green status indicator | **PASS** |
| **Compact Floating Panel** | Tapped Maya floating launcher | Opens compact floating assistant card overlay anchored at bottom-right | Anchored overlay card opens displaying `"Hi Maya! 👋"`, online status, and prompt pills | **PASS** |
| **AI Assistant Interaction** | Typed: *"Find me the cheapest Nike running shoes"* | Connects to BuyWise AI assistant API -> Returns price comparison breakdown | Responded with Myntra & Amazon live deal comparison | **PASS** |
| **Multilingual Maya** | Switched language to Hindi | Maya header & prompt buttons update to Hindi immediately | Displays `"नमस्ते माया! 👋"`, `"ऑनलाइन • शॉपिंग और फ़ैशन स्टाइलिस्ट"` | **PASS** |

### C. 🌐 Full Mobile App Language Localization Test
| TEST SCENARIO | ACTION | EXPECTED BEHAVIOR | PHYSICAL DEVICE RESULT | STATUS |
|---|---|---|---|---|
| **English UI** | Selected English in top bar | All BuyWise-owned UI text displayed in English | 100% English UI across Home, Search, Maya, Profile | **PASS** |
| **Hindi UI** | Selected Hindi (`hi`) | All BuyWise-owned UI text updates immediately to Hindi | Home -> "होम", Search -> "स्मार्ट तुलना", Categories -> "फ़ैशन और कपड़े" | **PASS** |
| **Hinglish UI** | Selected Hinglish (`hi-en`) | UI updates to Romanized Indian English | Home -> "Home", Search -> "Compare", Categories -> "Category ke hisaab se bestsellers" | **PASS** |
| **Persistence Across Restart**| Restarted app after selecting Hindi | Selected language persists via `SharedPreferences` | App launches directly in Hindi (`hi`) without resetting | **PASS** |

---

## 3. Product Advertisement Deep Link Regression
* **Test Case A**: Affiliate product ad click -> `https://buywiseai.pajonline.co.in/product/nike-air-max-270` -> Routes directly to `ProductDetailsScreen` (`nike-air-max-270`). **PASS**
* **Test Case B**: Partner store product ad click -> `https://buywiseai.pajonline.co.in/product/samsung-galaxy-s24-ultra` -> Routes directly to `ProductDetailsScreen` (`samsung-galaxy-s24-ultra`). **PASS**
* **Result**: Zero product ad clicks land on Home (`/`), Search (`/search`), or Store (`/store`). 100% canonical product landing match.
