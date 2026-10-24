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
        
        // Lowest price in Meesho is ₹449.0, BuyWise is ₹499.0
        val minLowest = lowestPriceOffers.minOf { it.price }
        assertEquals("Lowest price girl dress should be 449.0 on Meesho", 449.0, minLowest, 0.01)

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
        assertEquals("Lowest price women dress should be 649.0 on Meesho", 649.0, minLowest, 0.01)
    }
}


