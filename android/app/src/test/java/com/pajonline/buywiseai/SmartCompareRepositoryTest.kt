package com.pajonline.buywiseai

import com.pajonline.buywiseai.data.api.BuyWiseApiService
import com.pajonline.buywiseai.data.api.ComparePostRequest
import com.pajonline.buywiseai.data.api.HealthResponse
import com.pajonline.buywiseai.data.api.ScrapeProductRequest
import com.pajonline.buywiseai.data.api.VtoGenerateRequest
import com.pajonline.buywiseai.data.api.VtoGenerateResponse
import com.pajonline.buywiseai.data.repository.ComparisonApiException
import com.pajonline.buywiseai.data.repository.ComparisonMalformedException
import com.pajonline.buywiseai.data.repository.ComparisonNetworkException
import com.pajonline.buywiseai.data.repository.ComparisonTimeoutException
import com.pajonline.buywiseai.data.repository.SmartCompareRepository
import com.pajonline.buywiseai.domain.model.ComparisonResponse
import com.pajonline.buywiseai.domain.model.ComparisonSummary
import com.pajonline.buywiseai.domain.model.StoreOffer
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import java.io.IOException

class SmartCompareRepositoryTest {

    private lateinit var fakeApiService: FakeBuyWiseApiService
    private lateinit var repository: SmartCompareRepository

    class FakeBuyWiseApiService : BuyWiseApiService {
        var responseProvider: (suspend (String) -> Response<ComparisonResponse>)? = null

        override suspend fun compareProducts(query: String): Response<ComparisonResponse> {
            val provider = responseProvider ?: throw IllegalStateException("No response provider configured")
            return provider(query)
        }

        override suspend fun getHealth(): Response<HealthResponse> = Response.success(HealthResponse("ok"))
        override suspend fun compareProductsPost(request: ComparePostRequest): Response<ComparisonResponse> = Response.success(ComparisonResponse())
        override suspend fun scrapeProduct(request: ScrapeProductRequest): Response<Map<String, Any>> = Response.success(emptyMap())
        override suspend fun generateVto(request: VtoGenerateRequest): Response<VtoGenerateResponse> = Response.success(VtoGenerateResponse(true))
    }

    @Before
    fun setUp() {
        fakeApiService = FakeBuyWiseApiService()
        repository = SmartCompareRepository(apiService = fakeApiService, allowDevMockFallback = false, timeoutMs = 200L)
    }

    @Test
    fun testValidJsonResultWithOffers() = runBlocking {
        val sampleOffer = StoreOffer(
            id = "off_1",
            store = "Amazon",
            title = "Lancer Wonder-3 Running Shoes",
            price = 472.0,
            url = "https://www.amazon.in/dp/B00TEST?tag=pajonline-21",
            verificationStatus = "verified_live"
        )
        val validResponse = ComparisonResponse(
            product = "Lancer Wonder-3 Running Shoes",
            query = "shoes",
            stores = listOf(sampleOffer),
            summary = ComparisonSummary(totalStoresChecked = 5, lowestPrice = 472.0)
        )

        fakeApiService.responseProvider = { Response.success(validResponse) }

        val result = repository.searchSmartCompare("shoes")
        assertTrue("Expected search to succeed", result.isSuccess)
        val body = result.getOrNull()
        assertNotNull(body)
        assertEquals(1, body!!.stores.size)
        assertEquals(472.0, body.stores[0].price, 0.01)
        assertEquals("Amazon", body.stores[0].store)
    }

    @Test
    fun testValidEmptyResultsNotTreatedAsError() = runBlocking {
        val emptyResponse = ComparisonResponse(
            product = "Rare Exotic Artifact 999",
            query = "Rare Exotic Artifact 999",
            stores = emptyList(),
            summary = ComparisonSummary(totalStoresChecked = 5, lowestPrice = 0.0)
        )

        fakeApiService.responseProvider = { Response.success(emptyResponse) }

        val result = repository.searchSmartCompare("Rare Exotic Artifact 999")
        assertTrue("Valid empty response must succeed honestly", result.isSuccess)
        val body = result.getOrNull()
        assertNotNull(body)
        assertTrue("Stores must be empty without fabricating fake offers", body!!.stores.isEmpty())
    }

    @Test
    fun testHttp400BadRequestDoesNotTriggerSyntheticOffers() = runBlocking {
        fakeApiService.responseProvider = {
            Response.error(400, "{\"error\":\"Search query is required.\"}".toResponseBody("application/json".toMediaTypeOrNull()))
        }

        val result = repository.searchSmartCompare("invalid_query")
        assertTrue("HTTP 400 must produce Result.failure", result.isFailure)
        val exception = result.exceptionOrNull()
        assertTrue("Exception must be ComparisonApiException", exception is ComparisonApiException)
        assertEquals(400, (exception as ComparisonApiException).statusCode)
    }

    @Test
    fun testHttp429RateLimitProducesExplicitFailure() = runBlocking {
        fakeApiService.responseProvider = {
            Response.error(429, "{\"error\":\"Too many requests.\"}".toResponseBody("application/json".toMediaTypeOrNull()))
        }

        val result = repository.searchSmartCompare("sneakers")
        assertTrue("HTTP 429 must produce Result.failure", result.isFailure)
        val exception = result.exceptionOrNull()
        assertTrue("Exception must be ComparisonApiException", exception is ComparisonApiException)
        assertEquals(429, (exception as ComparisonApiException).statusCode)
    }

    @Test
    fun testHttp500ServerErrorProducesExplicitFailure() = runBlocking {
        fakeApiService.responseProvider = {
            Response.error(500, "{\"error\":\"Backend upstream failure\"}".toResponseBody("application/json".toMediaTypeOrNull()))
        }

        val result = repository.searchSmartCompare("sneakers")
        assertTrue("HTTP 500 must produce Result.failure", result.isFailure)
        val exception = result.exceptionOrNull()
        assertTrue("Exception must be ComparisonApiException", exception is ComparisonApiException)
        assertEquals(500, (exception as ComparisonApiException).statusCode)
    }

    @Test
    fun testMalformedEmptyBodyProducesFailure() = runBlocking {
        fakeApiService.responseProvider = {
            Response.success<ComparisonResponse>(null)
        }

        val result = repository.searchSmartCompare("sneakers")
        assertTrue("Empty body must produce Result.failure", result.isFailure)
        assertTrue(result.exceptionOrNull() is ComparisonMalformedException)
    }

    @Test
    fun testNetworkFailureProducesNetworkExceptionWhenNoCache() = runBlocking {
        fakeApiService.responseProvider = {
            throw IOException("Failed to connect to /127.0.0.1:443")
        }

        val result = repository.searchSmartCompare("sneakers")
        assertTrue("Network disconnect must produce Result.failure", result.isFailure)
        assertTrue(result.exceptionOrNull() is ComparisonNetworkException)
    }

    @Test
    fun testNetworkFailureWithExistingCacheReturnsHonestStaleData() = runBlocking {
        val initialOffer = StoreOffer(
            id = "cached_1",
            store = "Flipkart",
            title = "Cached Sneaker",
            price = 599.0,
            url = "https://www.flipkart.com/cached",
            verificationStatus = "verified_live"
        )
        val cachedResponse = ComparisonResponse(
            product = "Cached Sneaker",
            query = "cached_query",
            stores = listOf(initialOffer)
        )

        // Seed the cache with a previously successful request
        repository.putInCache("cached_query", cachedResponse, timestamp = 1700000000000L)

        // Now simulate network failure
        fakeApiService.responseProvider = {
            throw IOException("Network is completely offline")
        }

        val result = repository.searchSmartCompare("cached_query")
        assertTrue("Offline query with cache must succeed with stale data", result.isSuccess)
        val body = result.getOrNull()
        assertNotNull(body)
        assertEquals(1, body!!.stores.size)
        assertEquals("verification_stale", body.stores[0].verificationStatus)
        assertTrue(body.recommendation?.contains("[Offline Cache - Stale]") == true)
    }

    @Test
    fun testTimeoutProducesTimeoutException() = runBlocking {
        fakeApiService.responseProvider = {
            delay(500L) // Exceeds timeoutMs of 200L
            Response.success(ComparisonResponse())
        }

        val result = repository.searchSmartCompare("slow_query")
        assertTrue("Timeout must produce Result.failure", result.isFailure)
        assertTrue(result.exceptionOrNull() is ComparisonTimeoutException)
    }

    @Test
    fun testBlankQueryValidationRejectsImmediately() = runBlocking {
        val result = repository.searchSmartCompare("   ")
        assertTrue("Blank query must fail immediately", result.isFailure)
        val exception = result.exceptionOrNull() as? ComparisonApiException
        assertNotNull(exception)
        assertEquals(400, exception!!.statusCode)
    }

    @Test
    fun testAllowDevMockFallbackFillsEmptyStoresWhenBackendReturnsEmpty() = runBlocking {
        val devRepo = SmartCompareRepository(apiService = fakeApiService, allowDevMockFallback = true, timeoutMs = 200L)
        val emptyResponse = ComparisonResponse(
            product = "girl dresses",
            query = "girl dresses",
            stores = emptyList(),
            summary = ComparisonSummary(totalStoresChecked = 5, lowestPrice = 0.0)
        )
        fakeApiService.responseProvider = { Response.success(emptyResponse) }

        val result = devRepo.searchSmartCompare("girl dresses")
        assertTrue("Dev repo search should succeed", result.isSuccess)
        val body = result.getOrNull()
        assertNotNull(body)
        assertTrue("Stores must not be empty with fallback enabled", body!!.stores.isNotEmpty())
        assertTrue("Should contain Hopscotch or Dress offer", body.stores.any { it.title.contains("Dress", ignoreCase = true) || it.title.contains("Hopscotch", ignoreCase = true) })
    }
}

