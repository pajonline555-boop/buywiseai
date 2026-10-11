package com.pajonline.buywiseai.data.ai

/**
 * Authoritative Maya AI Knowledge Engine for Android.
 * Guarantees 100% material answer equivalence & parity with Web MayaKnowledgeService.
 */
object MayaKnowledgeEngine {

    fun isPromptInjection(query: String): Boolean {
        val q = query.lowercase()
        val patterns = listOf(
            "ignore rules", "ignore instructions", "override system", "pretend admin",
            "pretend you are admin", "pretend you are an administrator", "tell me the secret",
            "tell me secret", "hidden competition prize", "make up today", "make up discount",
            "make up a discount", "invent a price", "reveal private", "another user order",
            "another user's order", "ignore buywise", "system prompt", "disable competition rules",
            "private customer information", "not shown to normal users", "winner even if you don't know",
            "give me internal", "firebase credentials", "say buywise is 100% secure", "unhackable"
        )
        return patterns.any { q.contains(it) }
    }

    fun detectLanguage(query: String, userLangCode: String): String {
        if (userLangCode == "hi" || userLangCode == "hinglish") return userLangCode

        val hindiScript = Regex("[\\u0900-\\u097F]")
        if (hindiScript.containsMatchIn(query)) return "hi"

        val q = query.lowercase()
        val hinglishWords = listOf("kya", "kaise", "kahan", "kab", "hai", "hain", "mein", "par", "kar", "karo", "mujhe", "baare", "bhi")
        if (hinglishWords.any { q.contains(it) }) return "hinglish"

        return "en"
    }

    fun getAuthoritativeAnswer(
        query: String,
        userLangCode: String,
        lastCategory: String? = null,
        lastTimestamp: Long = 0L
    ): Pair<String, String?> {
        val lang = detectLanguage(query, userLangCode)
        val q = query.lowercase().trim()

        if (isPromptInjection(q)) {
            val refusal = when (lang) {
                "hi" -> "मैं इस अनुरोध को पूरा नहीं कर सकता। मैं आधिकारिक BuyWise AI सहायक हूँ और मैं सख्त नियमों का पालन करता हूँ।"
                "hinglish" -> "Main yeh request fulfill nahi kar sakta. Main official BuyWise AI Assistant hoon aur strict rules follow karta hoon."
                else -> "I cannot fulfill that request. I am the official BuyWise AI Assistant and I follow strict factual knowledge and authorization rules."
            }
            return Pair(refusal, null)
        }

        // Context Expiration Check (5 minutes)
        val isContextValid = (System.currentTimeMillis() - lastTimestamp) < 5 * 60 * 1000
        val isExplicitTopicSwitch = q.contains("compare") || q.contains("smartcompare") ||
                q.contains("order") || q.contains("vto") || q.contains("try on") ||
                q.contains("prime") || q.contains("coupon") || q.contains("alert")

        // 1. Competition Follow-Ups
        if (isContextValid && !isExplicitTopicSwitch && lastCategory == "COMPETITION") {
            if (q.contains("photo") || q.contains("image") || q.contains("upload")) {
                val ans = when (lang) {
                    "hi" -> "सक्रिय प्रतियोगिता खोलें, फ़ीचर्ड उत्पाद का उपयोग करके अपना Try-On परिणाम बनाएं, और 'Submit to Challenge' दबाएं।"
                    "hinglish" -> "Active challenge open karein, featured product se apna Try-On result banayein, aur 'Submit to Challenge' tap karein."
                    else -> "Open the active challenge, create your eligible Try-On result using the featured product, and tap 'Submit to Challenge' while submissions are open."
                }
                return Pair(ans, "COMPETITION")
            }
            if (q.contains("vote") || q.contains("voting") || q.contains("when does it close")) {
                val ans = when (lang) {
                    "hi" -> "वोटिंग अवधि के दौरान, पात्र उपयोगकर्ता स्वीकृत सबमिशन के लिए वोट कर सकते हैं। BuyWise केवल वैध वोटों की अनुमति देता है।"
                    "hinglish" -> "Voting period ke dauran eligible users approved submissions par vote kar sakte hain. Self-voting active competition rules par depend karti hai."
                    else -> "During the voting period, eligible users can vote for approved competition submissions. BuyWise allows only valid votes according to competition rules."
                }
                return Pair(ans, "COMPETITION")
            }
        }

        // 2. Direct Competition Queries
        if (q.contains("take part") || q.contains("participate") || q.contains("how to enter") ||
            q.contains("join kaise") || (q.contains("competition") && !q.contains("winner") && !q.contains("prize") && !q.contains("vote"))
        ) {
            val ans = when (lang) {
                "hi" -> "आप BuyWise के Weekly BuyWise Fashion Challenge में भाग लेने के लिए ऐप में दिए गए सक्रिय प्रतियोगिता को खोलें, उपलब्ध featured product का Try-On करें और submission period के दौरान अपना Try-On result जमा करें।"
                "hinglish" -> "BuyWise ke Weekly Fashion Challenge mein participate karne ke liye active challenge open karein, featured product ka Try-On karein aur submission period ke andar apna Try-On result submit karein."
                else -> "You can participate in the Weekly BuyWise Fashion Challenge by opening the featured challenge in BuyWise, using the eligible featured product with Try-On, creating your Try-On result, and submitting it during the active submission period."
            }
            return Pair(ans, "COMPETITION")
        }

        if (q.contains("winner") || q.contains("who won") || q.contains("winner kaise")) {
            val ans = when (lang) {
                "hi" -> "वोटिंग समाप्त होने के बाद, वैध वोटों की पुष्टि की जाती है और विजेता का निर्धारण उस प्रतियोगिता के आधिकारिक नियमों के अनुसार किया जाता है।"
                "hinglish" -> "Voting close hone ke baad valid votes verify hote hain. Winner official rules ke according decide hota hai."
                else -> "After voting closes, valid votes are verified by anti-fraud checks. The winner is determined according to the official rules of that competition."
            }
            return Pair(ans, "COMPETITION")
        }

        if (q.contains("prize") || q.contains("reward") || q.contains("prize kitna")) {
            val ans = when (lang) {
                "hi" -> "पुरस्कार की जानकारी सक्रिय प्रतियोगिता के आधिकारिक प्रकाशित नियमों पर निर्भर करती है।"
                "hinglish" -> "Prize details active competition ke official published terms par depend karte hain."
                else -> "Prize information depends on the officially published terms of the active competition. Maya reports current verified prize terms."
            }
            return Pair(ans, "COMPETITION")
        }

        if (q.contains("vote") || q.contains("voting")) {
            val ans = when (lang) {
                "hi" -> "वोटिंग अवधि के दौरान, पात्र उपयोगकर्ता स्वीकृत सबमिशन के लिए वोट कर सकते हैं।"
                "hinglish" -> "Voting period ke dauran, eligible users approved submissions ke liye vote kar sakte hain."
                else -> "During the voting period, eligible users can vote for approved competition submissions according to the competition rules."
            }
            return Pair(ans, "COMPETITION")
        }

        // 3. SmartCompare & Product Ads
        if (q.contains("smartcompare") || q.contains("compare") || q.contains("stores") || q.contains("lowest price")) {
            val ans = when (lang) {
                "hi" -> "SmartCompare BuyWise AI का उत्पाद तुलना अनुभव है। यह 14+ विक्रेता स्रोतों की तुलना करता है।"
                "hinglish" -> "SmartCompare BuyWise AI ka product comparison engine hai. Yeh availability ke according 14+ stores compare karta hai."
                else -> "SmartCompare is BuyWise AI's product comparison experience. It displays 14+ retailer sources depending on live availability."
            }
            return Pair(ans, "SMARTCOMPARE")
        }

        // 4. Virtual Try-On (VTO)
        if (q.contains("saree") || q.contains("jewellery") || q.contains("gown")) {
            val ans = when (lang) {
                "hi" -> "साड़ी Try-On वर्तमान में उपलब्ध BuyWise क्षमता के भीतर समर्थित है और बीटा ड्रेप पूर्वावलोकन प्रदान कर सकती है।"
                "hinglish" -> "Saree Try-On current BuyWise capability level ke andar supported hai aur Beta Drape Preview provide karta hai."
                else -> "Saree Try-On is supported within the currently available BuyWise capability level and may provide a Beta Drape Preview."
            }
            return Pair(ans, "VTO")
        }

        if (q.contains("try-on") || q.contains("try on") || q.contains("trial room") || q.contains("vto")) {
            val ans = when (lang) {
                "hi" -> "BuyWise AI Try-On आपको अपनी अपलोड की गई तस्वीर पर पात्र उत्पादों का पूर्वावलोकन करने देता है।"
                "hinglish" -> "BuyWise AI Try-On aapko apni uploaded photo par garments preview karne deta hai."
                else -> "BuyWise AI Try-On lets you preview eligible clothing and jewellery on your uploaded photo using the supported virtual try-on experience."
            }
            return Pair(ans, "VTO")
        }

        // 5. Orders, Shipping & Returns
        if (q.contains("return") || q.contains("refund")) {
            val ans = when (lang) {
                "hi" -> "रिटर्न प्रक्रिया: REQUESTED → APPROVED → RECEIVED → INSPECTED → RESTOCKED। अपने ऑर्डर विवरण पृष्ठ से रिटर्न का अनुरोध करें।"
                "hinglish" -> "Return flow: REQUESTED → APPROVED → RECEIVED → INSPECTED → RESTOCKED. Order details page se return request karein."
                else -> "Return lifecycle follows: REQUESTED → APPROVED → RECEIVED → INSPECTED → RESTOCKED. Request returns directly from your order details page."
            }
            return Pair(ans, "ORDERS")
        }

        if (q.contains("order") || q.contains("track") || q.contains("shipping") || q.contains("kahan hai mera order")) {
            val ans = when (lang) {
                "hi" -> "लाइव ट्रैकिंग देखने के लिए अपनी BuyWise प्रोफाइल खोलें और Orders सेक्शन में जाएं।"
                "hinglish" -> "Live tracking dekhne ke liye apni BuyWise Profile khol kar Orders section mein jayein."
                else -> "Open your BuyWise Profile and navigate to the Orders section to view live tracking status."
            }
            return Pair(ans, "ORDERS")
        }

        // 6. Prime Entitlement (Authoritative Factual Features & Pricing)
        if (q.contains("prime") || q.contains("membership") || q.contains("vip")) {
            val ans = when (lang) {
                "hi" -> "BuyWise Prime प्लान में मासिक (₹199/माह) और वार्षिक (₹1,499/वर्ष) शामिल हैं। अधिकृत लाभ: AI Virtual Try-On कोटा (10-100 Try-Ons/माह GPU गवर्नर नियमों के तहत), इंस्टेंट प्राइस ड्रॉप अलर्ट, एक्सक्लूसिव पार्टनर छूट, प्रायोरिटी AI प्रोसेसिंग, और अर्ली डील एक्सेस।"
                "hinglish" -> "BuyWise Prime plans mein Monthly (₹199/month) aur Annual (₹1,499/year) hain. Authoritative benefits: AI Virtual Try-On quota (10-100 Try-Ons/month subject to GPU governor rules), Instant Price Drop Alerts, Exclusive Partner Discounts, Priority AI Processing, aur Early Deal Access."
                else -> "BuyWise Prime plans include Monthly (₹199/month) and Annual (₹1,499/year). Authoritative features include: Generous AI Virtual Try-On allocations (10-100 Try-Ons/month subject to GPU governor rules), Instant Price Drop Alerts, Exclusive Partner Discounts, Priority AI Processing, and Early Deal Access."
            }
            return Pair(ans, "PRIME")
        }

        // 0. General Identity Query
        if (q.contains("what is buywise") || q.contains("buywise kya hai") || q == "buywise" || q == "what is buywise ai") {
            val ans = when (lang) {
                "hi" -> "BuyWise AI आपका बुद्धिमान शॉपिंग सहायक है जो 14+ स्टोर की कीमतों की तुलना करता है, एआई वर्चुअल ट्रायल रूम प्रदान करता है, और फैशन चुनौतियां चलाता है।"
                "hinglish" -> "BuyWise AI aapka smart shopping assistant hai jo 14+ stores compare karke best prices dhoondhta hai, AI Virtual Trial Room fitting deta hai, aur weekly fashion challenges run karta hai."
                else -> "BuyWise AI is your intelligent shopping assistant that aggregates 14+ stores to find the best prices, offers AI Virtual Trial Room fitting, and runs weekly fashion challenges."
            }
            return Pair(ans, "GENERAL")
        }

        // 7. Security & Safety & VTO Privacy
        if (q.contains("private") || q.contains("privacy") || q.contains("photo private")) {
            val ans = when (lang) {
                "hi" -> "हाँ! आपकी वर्चुअल ट्रायल-ऑन तस्वीरें DPDP 2025 के अनुपालन में स्थानीय डिवाइस एन्क्रिप्शन के तहत 100% निजी रूप से संग्रहीत की जाती हैं।"
                "hinglish" -> "Haan! Aapki Virtual Try-On selfie photos DPDP 2025 compliance ke under local device encryption ke saath 100% private rehti hain."
                else -> "Yes! Your Virtual Try-On selfie photos are stored privately under local device encryption in compliance with India DPDP 2025 rules."
            }
            return Pair(ans, "PRIVACY")
        }

        if (q.contains("microphone") || q.contains("mic search") || q.contains("voice search")) {
            val ans = when (lang) {
                "hi" -> "सर्च बार या माया में माइक्रोफ़ोन आइकॉन (🎙️) पर टैप करें। आप इंग्लिश, हिंदी या हिंग्लिश में बोल सकते हैं और परिणाम तुरंत दिखाई देंगे।"
                "hinglish" -> "Search bar ya Maya mein microphone icon (🎙️) tap karein. Aap English, Hindi ya Hinglish mein bol sakte hain aur instant results milenge."
                else -> "Tap the microphone icon (🎙️) in Search or Maya. You can speak your query in English, Hindi, or Hinglish for instant voice comparison."
            }
            return Pair(ans, "VOICE")
        }

        if (q.contains("secure") || q.contains("safety") || q.contains("safe hai kya")) {
            val ans = when (lang) {
                "hi" -> "BuyWise HTTPS एन्क्रिप्शन, प्रमाणीकरण और सुरक्षित भुगतान प्रसंस्करण लागू करता है।"
                "hinglish" -> "BuyWise HTTPS encryption, authentication aur secure payment processing use karta hai."
                else -> "BuyWise implements factual security controls such as HTTPS encryption, OAuth authentication, rate limiting, and secure payment processing."
            }
            return Pair(ans, "SECURITY")
        }

        // 8. Safe Unconfirmed Fallback
        val fallback = when (lang) {
            "hi" -> "क्षमा करें, मेरे पास अभी इस बारे में पुष्टि की गई जानकारी नहीं है। कृपया संबंधित BuyWise अनुभाग देखें या BuyWise सहायता से संपर्क करें।"
            "hinglish" -> "Sorry, mere paas abhi is baare mein confirmed information nahi hai. Kripya relevant BuyWise section check karein ya BuyWise support se contact karein."
            else -> "Sorry, I don't have confirmed information about that yet. Please check the relevant BuyWise section or contact BuyWise support."
        }
        return Pair(fallback, null)
    }
}
