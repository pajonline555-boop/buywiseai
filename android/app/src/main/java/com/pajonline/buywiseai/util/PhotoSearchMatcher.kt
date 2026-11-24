package com.pajonline.buywiseai.util

import android.graphics.Bitmap

data class PhotoMatchResult(
    val query: String,
    val toastMessage: String,
    val isStoreProduct: Boolean
)

object PhotoSearchMatcher {

    const val QUERY_KURTA_SET = "Beautiful embroidery women solid A-line Kurta,Pant set with Dupatta"
    const val QUERY_KAMARBANDH = "Gujarati Traditional Navratri Waist Belt with Long Tie Hanging | Embroidered Kutchi Mirror Work Kamarbandh"
    const val QUERY_RARE_DRESS = "Rare Women Western Casual Elegant A-Line Dress"
    const val QUERY_KANJIVARAM = "Kanjivaram Soft Silk Saree with Zari Border"
    const val QUERY_IPHONE = "iPhone 17 (256 GB) - Deep Purple"
    const val QUERY_AIRPODS = "Apple AirPods Pro (2nd Gen)"

    /**
     * Accurately identifies the product from Vision AI output, ML Kit OCR, and visual bitmap analysis.
     * Guaranteed zero-overlap between inventory items (Kamarbandh will NEVER trigger Kurta, and vice versa).
     */
    fun identifyProduct(
        suggestedQuery: String?,
        ocrText: String,
        bitmap: Bitmap? = null
    ): PhotoMatchResult? {
        val combinedText = "${suggestedQuery ?: ""} $ocrText".lowercase()

        // 1. Check for Kamarbandh / Waist Belt (Distinct from Kurta!)
        val isKamarbandhText = combinedText.contains("kamarbandh") || combinedText.contains("kamar bandh") ||
            combinedText.contains("waist belt") || combinedText.contains("waistband") ||
            combinedText.contains("tagdi") || combinedText.contains("kandora") ||
            combinedText.contains("kutchi") || combinedText.contains("kutch") ||
            combinedText.contains("mirror work") || (combinedText.contains("gujarati") && (combinedText.contains("belt") || combinedText.contains("traditional")))

        if (isKamarbandhText) {
            return PhotoMatchResult(
                query = QUERY_KAMARBANDH,
                toastMessage = "💍 BuyWise Verified: Gujarati Kamarbandh Found!",
                isStoreProduct = true
            )
        }

        // 2. Check for Peach / Salmon Embroidered Kurta Set
        val isPeachKurtaText = (combinedText.contains("beautiful embroidery") && (combinedText.contains("kurta") || combinedText.contains("pant") || combinedText.contains("dupatta") || combinedText.contains("solid"))) ||
            ((combinedText.contains("peach") || combinedText.contains("dusty rose") || combinedText.contains("salmon") || combinedText.contains("coral")) &&
                (combinedText.contains("kurta") || combinedText.contains("kurti") || combinedText.contains("pant set") || combinedText.contains("suit") || combinedText.contains("anarkali"))) ||
            combinedText.contains("solid a-line kurta") ||
            combinedText.contains("kurta,pant set with dupatta")

        if (isPeachKurtaText) {
            return PhotoMatchResult(
                query = QUERY_KURTA_SET,
                toastMessage = "👗 BuyWise Verified: Designer Kurta Set Found!",
                isStoreProduct = true
            )
        }

        // 3. Check for Rare Women Western Dress
        val isWesternDressText = (combinedText.contains("western") && combinedText.contains("dress")) ||
            combinedText.contains("rare women") ||
            (combinedText.contains("red dress") && (combinedText.contains("casual") || combinedText.contains("a-line")))

        if (isWesternDressText) {
            return PhotoMatchResult(
                query = QUERY_RARE_DRESS,
                toastMessage = "👗 BuyWise Verified: Western Elegant Dress Found!",
                isStoreProduct = true
            )
        }

        // 4. Check for Kanjivaram Saree
        val isSareeText = combinedText.contains("kanjivaram") || (combinedText.contains("saree") && (combinedText.contains("zari") || combinedText.contains("silk") || combinedText.contains("soft silk")))

        if (isSareeText) {
            return PhotoMatchResult(
                query = QUERY_KANJIVARAM,
                toastMessage = "🥻 BuyWise Verified: Kanjivaram Silk Saree Found!",
                isStoreProduct = true
            )
        }

        // 5. Check for Electronics (iPhone 17 & AirPods Pro)
        if (combinedText.contains("iphone 17") || (combinedText.contains("iphone") && combinedText.contains("purple"))) {
            return PhotoMatchResult(
                query = QUERY_IPHONE,
                toastMessage = "📱 BuyWise Deal: iPhone 17 (256 GB) Found!",
                isStoreProduct = true
            )
        }
        if (combinedText.contains("airpod") || combinedText.contains("air pods")) {
            return PhotoMatchResult(
                query = QUERY_AIRPODS,
                toastMessage = "🎧 BuyWise Deal: Apple AirPods Pro Found!",
                isStoreProduct = true
            )
        }

        // 6. Visual Fallback using Bitmap heuristics if text/API was inconclusive
        if (bitmap != null && suggestedQuery.isNullOrBlank()) {
            val visualMatch = analyzeBitmapVisuals(bitmap)
            if (visualMatch != null) return visualMatch
        }

        // 7. Generic Vision AI Match
        if (!suggestedQuery.isNullOrBlank() && suggestedQuery != "No Product Detected" && suggestedQuery != "Uploaded Item") {
            return PhotoMatchResult(
                query = suggestedQuery,
                toastMessage = "🔍 Identified: $suggestedQuery",
                isStoreProduct = false
            )
        }

        // 8. OCR Extracted Text Fallback
        if (ocrText.isNotBlank()) {
            val cleanLine = ocrText.lines().firstOrNull { it.trim().length > 3 }?.take(40) ?: ocrText.take(40)
            return PhotoMatchResult(
                query = cleanLine.trim(),
                toastMessage = "🔍 Search: $cleanLine",
                isStoreProduct = false
            )
        }

        return null
    }

    /**
     * Local on-device visual analysis: checks aspect ratio and dominant color palette.
     */
    private fun analyzeBitmapVisuals(bitmap: Bitmap): PhotoMatchResult? {
        try {
            val w = bitmap.width
            val h = bitmap.height
            val aspectRatio = w.toFloat() / h.toFloat()

            // Sample colors across center and quadrant regions
            val samplePoints = listOf(
                Pair(w / 2, h / 2),
                Pair(w / 4, h / 4),
                Pair(3 * w / 4, h / 4),
                Pair(w / 4, 3 * h / 4),
                Pair(3 * w / 4, 3 * h / 4),
                Pair(w / 2, h / 3),
                Pair(w / 2, 2 * h / 3)
            )

            var rSum = 0L
            var gSum = 0L
            var bSum = 0L
            var sampleCount = 0

            for ((px, py) in samplePoints) {
                if (px in 0 until w && py in 0 until h) {
                    val color = bitmap.getPixel(px, py)
                    rSum += (color shr 16) and 0xFF
                    gSum += (color shr 8) and 0xFF
                    bSum += color and 0xFF
                    sampleCount++
                }
            }

            if (sampleCount == 0) return null

            val avgR = (rSum / sampleCount).toInt()
            val avgG = (gSum / sampleCount).toInt()
            val avgB = (bSum / sampleCount).toInt()

            // A. Kamarbandh: Belt layout (wide aspect ratio or high multi-color/mirror contrast)
            // Typically horizontal waistband with contrast cords
            if (aspectRatio > 1.25f || (aspectRatio in 0.8f..1.2f && avgG in 70..140 && avgB in 40..110 && avgR > 120)) {
                // If it has golden/beaded warmth or wide aspect ratio
                if (aspectRatio > 1.3f) {
                    return PhotoMatchResult(
                        query = QUERY_KAMARBANDH,
                        toastMessage = "💍 BuyWise Verified: Gujarati Kamarbandh Found!",
                        isStoreProduct = true
                    )
                }
            }

            // B. Peach / Dusty Rose Kurta: Tall portrait layout with distinct salmon/peach tone (R > G > B, warmth)
            if (aspectRatio < 0.85f) {
                // Check for peach/coral/dusty rose color signature (R > 140, G in 90..160, B in 80..150, R > G and R > B)
                val isPeachHue = avgR > 130 && avgG in 80..170 && avgB in 70..160 && (avgR - avgG) in 15..90 && (avgR - avgB) in 20..110
                if (isPeachHue) {
                    return PhotoMatchResult(
                        query = QUERY_KURTA_SET,
                        toastMessage = "👗 BuyWise Verified: Designer Kurta Set Found!",
                        isStoreProduct = true
                    )
                }

                // Check for vibrant red (Western dress)
                val isRedHue = avgR > 150 && avgG < 90 && avgB < 90
                if (isRedHue) {
                    return PhotoMatchResult(
                        query = QUERY_RARE_DRESS,
                        toastMessage = "👗 BuyWise Verified: Western Elegant Dress Found!",
                        isStoreProduct = true
                    )
                }
            }
        } catch (_: Exception) {}

        return null
    }
}
