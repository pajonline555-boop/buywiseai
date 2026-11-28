package com.pajonline.buywiseai

import com.pajonline.buywiseai.data.repository.SmartMarketIntelligence
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmartMarketIntelligenceTest {

    @Test
    fun testJacketsSearchDoesNotReturnAC() {
        val result = SmartMarketIntelligence.generateMarketComparison("Jackets")
        
        // Must contain jacket / outerwear stores and titles
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())
        val firstStore = result.stores.first()
        println("DEBUG RESULT FOR JACKETS: ${firstStore.store} | ${firstStore.title} | ${firstStore.price}")
        // Assert it does NOT mention Daikin, AC, or Air Conditioner
        assertFalse("Title must not contain Daikin", firstStore.title.contains("Daikin", ignoreCase = true))
        assertFalse("Title must not contain Split", firstStore.title.contains("Split", ignoreCase = true))
        
        // Assert it properly contains Jacket
        assertTrue("Title should contain Jacket: ${firstStore.title}", firstStore.title.contains("Jacket", ignoreCase = true))
        
        // Assert price is realistic for jackets (~1699, not 44990)
        assertTrue("Price should be around ₹1,699, got: ${firstStore.price}", firstStore.price < 2500.0)
        
        // Assert Myntra or AJIO is included for fashion
        val storeNames = result.stores.map { it.store }
        assertTrue("Stores should include Myntra", storeNames.contains("Myntra"))
        assertTrue("Stores should include AJIO", storeNames.contains("AJIO"))
    }

    @Test
    fun testHeadphonesDoesNotMatchLaptopHP() {
        val result = SmartMarketIntelligence.generateMarketComparison("Headphones")
        val firstStore = result.stores.first()
        
        assertFalse("Headphones must not return HP Pavilion Laptop", firstStore.title.contains("Laptop", ignoreCase = true))
        assertFalse("Headphones must not return HP Pavilion", firstStore.title.contains("Pavilion", ignoreCase = true))
    }

    @Test
    fun testSamsung43MatchesTelevision() {
        val result = SmartMarketIntelligence.generateMarketComparison("Samsung 43")
        val firstStore = result.stores.first()
        println("DEBUG RESULT FOR SAMSUNG 43: ${firstStore.store} | ${firstStore.title} | ${firstStore.price}")
        
        assertTrue("Should return Samsung TV", firstStore.title.contains("Samsung", ignoreCase = true))
        assertTrue("Should contain TV/LED", firstStore.title.contains("TV", ignoreCase = true) || firstStore.title.contains("LED", ignoreCase = true))
        
        // Check Amazon India price is ₹24,490
        val amz = result.stores.find { it.store == "Amazon India" }
        assertEquals("Amazon price for Samsung 43 should be 24490.0", 24490.0, amz?.price ?: 0.0, 0.01)
    }

    @Test
    fun testSplitACMatchesAppliance() {
        val result = SmartMarketIntelligence.generateMarketComparison("Split AC")
        val firstStore = result.stores.first()
        
        assertTrue("Should return Daikin AC", firstStore.title.contains("AC", ignoreCase = true))
        assertEquals("Daikin AC price should be 44990.0", 44990.0, firstStore.price, 0.01)
    }

    @Test
    fun testDirectStoreUrlGeneration() {
        val flipkartUrl = SmartMarketIntelligence.buildDirectStoreUrl("Flipkart", "Men & Women Lightweight Water-Resistant Padded Bomber Jacket")
        val myntraUrl = SmartMarketIntelligence.buildDirectStoreUrl("Myntra", "Men & Women Lightweight Water-Resistant Padded Bomber Jacket")
        val amazonUrl = SmartMarketIntelligence.buildDirectStoreUrl("Amazon India", "Men & Women Lightweight Water-Resistant Padded Bomber Jacket")

        assertEquals("https://www.flipkart.com/search?q=jackets", flipkartUrl)
        assertEquals("https://www.myntra.com/jackets", myntraUrl)
        assertEquals("https://www.amazon.in/s?k=jackets&tag=pajonline-21", amazonUrl)
    }

    @Test
    fun testCommonLipsticksSearchReturnsDualItemsLowestPriceAndBranded() {
        val result = SmartMarketIntelligence.generateMarketComparison("Lipsticks")
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        val brandedOffers = result.stores.filter { it.matchType == "BRANDED" }

        assertTrue("Must include Lowest Price Found offers", lowestPriceOffers.isNotEmpty())
        assertTrue("Must include Branded offers", brandedOffers.isNotEmpty())

        // Verify lowest price found item is Blue Heaven Hyper Stay Liquid Matte Lipstick at ₹97 on Amazon India
        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price found must be 97.0 on Amazon India", 97.0, minLowest, 0.01)
        assertTrue("Lowest price title should be Blue Heaven", lowestPriceOffers.first().title.contains("Blue Heaven", ignoreCase = true))

        val amzLowest = lowestPriceOffers.find { it.store == "Amazon India" }
        assertEquals("Amazon India price must be 97.0", 97.0, amzLowest?.price ?: 0.0, 0.01)

        // Verify branded item is Maybelline at ₹499
        val minBranded = brandedOffers.minOf { it.price }
        assertEquals("Branded price must be 499.0", 499.0, minBranded, 0.01)
        assertTrue("Branded title should be Maybelline", brandedOffers.first().title.contains("Maybelline", ignoreCase = true))

        // Verify stores include Nykaa, Amazon India, Flipkart
        val storeNames = result.stores.map { it.store }.toSet()
        assertTrue("Must include Nykaa", storeNames.contains("Nykaa"))
        assertTrue("Must include Amazon India", storeNames.contains("Amazon India"))
        assertTrue("Must include Flipkart", storeNames.contains("Flipkart"))

        // Verify summary lowest price
        assertEquals("Summary lowest price should be 97.0", 97.0, result.summary?.lowestPrice ?: 0.0, 0.01)
    }

    @Test
    fun testSpecificBrandLipstickSearchReturnsSingleBrand() {
        val result = SmartMarketIntelligence.generateMarketComparison("Maybelline Lipstick")
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())

        // Specific brand search should NOT split into generic lowest price tier
        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        assertTrue("Specific brand search should not have LOWEST_PRICE tier", lowestPriceOffers.isEmpty())
        assertTrue("Title should contain Maybelline", result.stores.first().title.contains("Maybelline", ignoreCase = true))
    }

    @Test
    fun testBlueHeavenLipstickSearchReturnsSingleBrand() {
        val result = SmartMarketIntelligence.generateMarketComparison("Blue Heaven Lipstick")
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        assertTrue("Specific brand search should not have LOWEST_PRICE tier", lowestPriceOffers.isEmpty())

        val amz = result.stores.find { it.store == "Amazon India" }
        assertEquals("Amazon India price for Blue Heaven should be 97.0", 97.0, amz?.price ?: 0.0, 0.01)
        assertTrue("Title should contain Blue Heaven", result.stores.first().title.contains("Blue Heaven", ignoreCase = true))
    }

    @Test
    fun testCommonSunscreenSearchReturnsDualItems() {
        val result = SmartMarketIntelligence.generateMarketComparison("Sunscreen")
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        val brandedOffers = result.stores.filter { it.matchType == "BRANDED" }

        assertTrue("Must include Lowest Price Found offers for sunscreen", lowestPriceOffers.isNotEmpty())
        assertTrue("Must include Branded offers for sunscreen", brandedOffers.isNotEmpty())

        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price sunscreen must be 199.0", 199.0, minLowest, 0.01)
    }

    @Test
    fun testCommonShoesSearchReturnsDualItems() {
        val result = SmartMarketIntelligence.generateMarketComparison("Shoes")
        assertTrue("Stores must not be empty", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        val brandedOffers = result.stores.filter { it.matchType == "BRANDED" }

        assertTrue("Must include Lowest Price Found offers for shoes", lowestPriceOffers.isNotEmpty())
        assertTrue("Must include Branded offers for shoes", brandedOffers.isNotEmpty())

        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price shoes must be 472.0 on Amazon India", 472.0, minLowest, 0.01)
    }

    @Test
    fun testGirlDressesReturnsHopscotchAndLittleBansi() {
        val result = SmartMarketIntelligence.generateMarketComparison("girl dresses")
        assertTrue("Stores must not be empty for girl dresses", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        val brandedOffers = result.stores.filter { it.matchType == "BRANDED" }

        assertTrue("Must include Lowest Price Found offers for girl dresses", lowestPriceOffers.isNotEmpty())
        assertTrue("Must include Branded offers for girl dresses", brandedOffers.isNotEmpty())

        val hopscotchOffer = lowestPriceOffers.first()
        assertTrue("Title should mention Hopscotch or Dress: ${hopscotchOffer.title}", 
            hopscotchOffer.title.contains("Hopscotch", ignoreCase = true) || hopscotchOffer.title.contains("Dress", ignoreCase = true))
        
        // Lowest price on Amazon India is ₹449.0, no BuyWise Store in non-inventory fashion
        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price girl dress should be 449.0 on Amazon India", 449.0, minLowest, 0.01)
        assertEquals("Amazon India", lowestPriceOffers.first().store)
        assertTrue("Non-inventory search must not contain BuyWise Store", result.stores.none { it.store.contains("BuyWise") })

        val stores = result.stores.map { it.store }.toSet()
        assertTrue("Must include Amazon India", stores.contains("Amazon India"))
        assertTrue("Must include Flipkart", stores.contains("Flipkart"))
        assertTrue("Must include Meesho", stores.contains("Meesho"))
        assertTrue("Must include Myntra", stores.contains("Myntra"))
    }

    @Test
    fun testWomensDressesReturnsWesternDresses() {
        val result = SmartMarketIntelligence.generateMarketComparison("dress")
        assertTrue("Stores must not be empty for dress", result.stores.isNotEmpty())

        val lowestPriceOffers = result.stores.filter { it.matchType == "LOWEST_PRICE" }
        assertTrue("Must include Lowest Price Found offers for dress", lowestPriceOffers.isNotEmpty())
        val lowest = lowestPriceOffers.first()
        assertTrue("Title should contain dress: ${lowest.title}", lowest.title.contains("Dress", ignoreCase = true))
        
        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price women dress should be 599.0 on Amazon India", 599.0, minLowest, 0.01)
        assertEquals("Amazon India", lowest.store)
        assertTrue("Non-inventory search must not contain BuyWise Store", result.stores.none { it.store.contains("BuyWise") })
    }

    @Test
    fun testWomenDustyRoseSearchReturnsBuyWiseStoreKurtaSet() {
        val queries = listOf(
            "Women dusty rose",
            "dusty rose",
            "Women Peach Kurta",
            "Beautiful embroidery women solid A-line Kurta",
            "kurta pant set with dupatta"
        )

        for (q in queries) {
            val result = SmartMarketIntelligence.generateMarketComparison(q)
            assertTrue("Stores must not be empty for '$q'", result.stores.isNotEmpty())

            // 1. Must never return Roadster Men Casual Wear or yellow sweatpants
            val anyRoadster = result.stores.any { it.title.contains("Roadster Men", ignoreCase = true) }
            assertFalse("Query '$q' must not return Roadster Men Casual Wear", anyRoadster)

            // 2. BuyWise Store must be present at ₹4999
            val buywiseOffer = result.stores.firstOrNull { it.store.contains("BuyWise", ignoreCase = true) }
            assertTrue("BuyWise Store offer must be present for '$q'", buywiseOffer != null)
            assertEquals("BuyWise Store price must be ₹4999", 4999.0, buywiseOffer!!.price, 0.01)
            assertTrue("BuyWise Store title must contain Kurta", buywiseOffer.title.contains("Kurta", ignoreCase = true))
            assertTrue("BuyWise Store image must point to dusty rose kurta", buywiseOffer.imageUrl?.contains("dusty_rose_kurta.png") == true)

            // 3. BuyWise Store must be the LOWEST price offer (no false cheaper competitor listings)
            val lowestOffer = result.stores.firstOrNull { it.matchType == "LOWEST_PRICE" }
            assertTrue("Lowest offer must exist for '$q'", lowestOffer != null)
            assertEquals("BuyWise Store lowest price must be ₹4999", 4999.0, lowestOffer!!.price, 0.01)
            assertTrue("Lowest offer must be BuyWise Store", lowestOffer.store.contains("BuyWise", ignoreCase = true))

            // 4. Must NOT contain false dress listings on other platforms like Meesho or Myntra
            val meeshoOffer = result.stores.firstOrNull { it.store.contains("Meesho", ignoreCase = true) }
            assertTrue("Query '$q' for BuyWise listed dress must not contain false Meesho listings", meeshoOffer == null)

            val myntraOffer = result.stores.firstOrNull { it.store.contains("Myntra", ignoreCase = true) }
            assertTrue("Query '$q' for BuyWise listed dress must not contain false Myntra listings", myntraOffer == null)

            // 5. Summary metrics must reflect BuyWise Store lowest price & savings
            assertEquals(4999.0, result.summary?.lowestPrice ?: 0.0, 0.01)
            assertEquals(2000.0, result.summary?.maximumSavings ?: 0.0, 0.01)
        }
    }

    @Test
    fun testKamarbandhSearchDoesNotReturnKurta() {
        val result = SmartMarketIntelligence.generateMarketComparison("Gujarati Traditional Embroidered Kamarbandh")
        assertTrue("Stores must not be empty for Kamarbandh", result.stores.isNotEmpty())

        val buywiseOffer = result.stores.firstOrNull { it.store.contains("BuyWise", ignoreCase = true) }
        assertTrue("BuyWise Store offer must exist for Kamarbandh", buywiseOffer != null)
        assertTrue("Title must contain Kamarbandh: ${buywiseOffer!!.title}", buywiseOffer.title.contains("Kamarbandh", ignoreCase = true))
        assertFalse("Kamarbandh search must NOT return Kurta", buywiseOffer.title.contains("Kurta", ignoreCase = true))
        assertEquals(499.0, buywiseOffer.price, 0.01)
    }

    @Test
    fun testPhotoSearchMatcherDistinctInventoryMatching() {
        // 1. Kamarbandh Vision output
        val kamarMatch = com.pajonline.buywiseai.util.PhotoSearchMatcher.identifyProduct(
            suggestedQuery = "Gujarati Traditional Navratri Embroidered Kutchi Kamarbandh Waist Belt",
            ocrText = "Kutchi Mirror Work"
        )
        assertTrue("Kamarbandh must be detected", kamarMatch != null)
        assertEquals(com.pajonline.buywiseai.util.PhotoSearchMatcher.QUERY_KAMARBANDH, kamarMatch!!.query)
        assertFalse("Kamarbandh must NOT match Kurta", kamarMatch.query.contains("Kurta"))

        // 2. Peach Kurta Vision output
        val kurtaMatch = com.pajonline.buywiseai.util.PhotoSearchMatcher.identifyProduct(
            suggestedQuery = "Women peach embroidered A-line kurta pant set with dupatta",
            ocrText = ""
        )
        assertTrue("Kurta must be detected", kurtaMatch != null)
        assertEquals(com.pajonline.buywiseai.util.PhotoSearchMatcher.QUERY_KURTA_SET, kurtaMatch!!.query)

        // 3. Western Dress
        val dressMatch = com.pajonline.buywiseai.util.PhotoSearchMatcher.identifyProduct(
            suggestedQuery = "Rare Women Western Casual Elegant A-Line Dress",
            ocrText = ""
        )
        assertTrue("Dress must be detected", dressMatch != null)
        assertEquals(com.pajonline.buywiseai.util.PhotoSearchMatcher.QUERY_RARE_DRESS, dressMatch!!.query)
    }

    @Test
    fun testNonInventorySearchShowsAmazonAsLowestAndNoBuyWiseStore() {
        val nonInventoryQueries = listOf(
            "Women light blue kurti",
            "Women Peach",
            "Rytras Women Pure Cotton Printed Straight Kurti",
            "cotton t-shirt",
            "running shoes"
        )

        for (q in nonInventoryQueries) {
            val result = SmartMarketIntelligence.generateMarketComparison(q)
            assertTrue("Stores must not be empty for '$q'", result.stores.isNotEmpty())

            // Amazon India must be lowest price
            val firstStore = result.stores.first()
            assertEquals("First store for '$q' must be Amazon India", "Amazon India", firstStore.store)
            assertEquals("Amazon India must have LOWEST_PRICE matchType for '$q'", "LOWEST_PRICE", firstStore.matchType)
            assertTrue("Amazon India must have isLowest=true for '$q'", firstStore.isLowest == true)

            // No BuyWise Store in non-inventory fashion search
            val hasBuyWise = result.stores.any { it.store.contains("BuyWise", ignoreCase = true) }
            assertFalse("Non-inventory search for '$q' must NOT include BuyWise Store", hasBuyWise)
        }
    }

    @Test
    fun testExactSearchedProductPreservedInStoreUrlsAcrossAllCategories() {
        // 1. Smartphone fallback query like "vivo t4 5g mobile"
        val vivoResult = SmartMarketIntelligence.generateMarketComparison("vivo t4 5g mobile")
        assertTrue("Stores must not be empty", vivoResult.stores.isNotEmpty())
        val vivoAmz = vivoResult.stores.first { it.store == "Amazon India" }
        val vivoFk = vivoResult.stores.first { it.store == "Flipkart" }
        assertTrue("Title must reflect searched product, got: ${vivoAmz.title}", vivoAmz.title.contains("Vivo T4", ignoreCase = true))
        assertEquals("Vivo T4 5G minimum price should be 16799.0", 16799.0, vivoAmz.price, 0.01)
        assertEquals("https://www.amazon.in/s?k=vivo+t4+5g+mobile&tag=pajonline-21", vivoAmz.url)
        assertEquals("https://www.flipkart.com/search?q=vivo+t4+5g+mobile", vivoFk.url)

        // 2. Fashion query like "Women light blue kurti"
        val kurtiResult = SmartMarketIntelligence.generateMarketComparison("Women light blue kurti")
        val kurtiAmz = kurtiResult.stores.first { it.store == "Amazon India" }
        val kurtiMyn = kurtiResult.stores.first { it.store == "Myntra" }
        assertEquals("https://www.amazon.in/s?k=Women+light+blue+kurti&tag=pajonline-21", kurtiAmz.url)
        assertEquals("https://www.myntra.com/women-light-blue-kurti", kurtiMyn.url)

        // 3. TV query like "TCL 55 inch QLED TV"
        val tvResult = SmartMarketIntelligence.generateMarketComparison("TCL 55 inch QLED TV")
        val tvAmz = tvResult.stores.first { it.store == "Amazon India" }
        assertEquals("https://www.amazon.in/s?k=TCL+55+inch+QLED+TV&tag=pajonline-21", tvAmz.url)
    }
}


