package com.pajonline.buywiseai.data.repository

import com.pajonline.buywiseai.data.api.ApiClient
import com.pajonline.buywiseai.data.api.BuyWiseApiService
import com.pajonline.buywiseai.domain.model.ComparisonResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap

open class ComparisonException(message: String, cause: Throwable? = null) : Exception(message, cause)

class ComparisonApiException(
    val statusCode: Int,
    message: String,
    val errorBody: String? = null
) : ComparisonException("HTTP $statusCode: $message")

class ComparisonNetworkException(
    message: String,
    cause: Throwable? = null
) : ComparisonException(message, cause)

class ComparisonTimeoutException(
    message: String = "Request timed out while contacting comparison service."
) : ComparisonException(message)

class ComparisonMalformedException(
    message: String = "Invalid or unparseable response from comparison service."
) : ComparisonException(message)

data class CachedComparison(
    val response: ComparisonResponse,
    val cachedAt: Long
)

class SmartCompareRepository(
    private val apiService: BuyWiseApiService = ApiClient.apiService,
    private val allowDevMockFallback: Boolean = com.pajonline.buywiseai.BuildConfig.DEBUG,
    private val timeoutMs: Long = 10000L
) {

    private val queryCache = ConcurrentHashMap<String, CachedComparison>()

    fun getCached(query: String): CachedComparison? {
        return queryCache[query.trim().lowercase()]
    }

    fun putInCache(query: String, response: ComparisonResponse, timestamp: Long = System.currentTimeMillis()) {
        queryCache[query.trim().lowercase()] = CachedComparison(response, timestamp)
    }

    fun clearCache() {
        queryCache.clear()
    }

    suspend fun searchSmartCompare(query: String): Result<ComparisonResponse> {
        return withContext(Dispatchers.IO) {
            val cleanQuery = query.trim()
            if (cleanQuery.isBlank()) {
                return@withContext Result.failure(
                    ComparisonApiException(400, "Search query is required and cannot be empty.")
                )
            }

            try {
                val response = withTimeoutOrNull(timeoutMs) {
                    apiService.compareProducts(cleanQuery)
                }

                if (response == null) {
                    // Check for honest cached fallback
                    val cached = getCached(cleanQuery)
                    if (cached != null) {
                        val staleResponse = cached.response.copy(
                            recommendation = "[Offline Cache - Stale] Retrieved from cache (${cached.cachedAt}). Request timed out.",
                            stores = cached.response.stores.map { it.copy(verificationStatus = "verification_stale") }
                        )
                        return@withContext Result.success(staleResponse)
                    }

                    if (allowDevMockFallback) {
                        val mock = SmartMarketIntelligence.generateMarketComparison(cleanQuery).copy(
                            recommendation = "[Mock Fixture - Dev Mode] Unverified synthetic data for development only.",
                            stores = SmartMarketIntelligence.generateMarketComparison(cleanQuery).stores.map {
                                it.copy(verificationStatus = "unverified_mock")
                            }
                        )
                        return@withContext Result.success(mock)
                    }

                    return@withContext Result.failure(
                        ComparisonTimeoutException("Comparison request timed out after ${timeoutMs}ms.")
                    )
                }

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body == null) {
                        return@withContext Result.failure(
                            ComparisonMalformedException("Comparison service returned an empty response body.")
                        )
                    }

                    // Valid result (can be empty stores if no product matched, or filled stores)
                    putInCache(cleanQuery, body)
                    return@withContext Result.success(body)
                } else {
                    // Non-2xx response (400, 401, 403, 404, 429, 5xx): NEVER silently fabricate live offers
                    val code = response.code()
                    val errBody = try {
                        response.errorBody()?.string()
                    } catch (e: Exception) {
                        null
                    }

                    if (allowDevMockFallback) {
                        val mock = SmartMarketIntelligence.generateMarketComparison(cleanQuery).copy(
                            recommendation = "[Mock Fixture - Dev Mode] Live server returned HTTP $code. Showing developmental benchmark data.",
                            stores = SmartMarketIntelligence.generateMarketComparison(cleanQuery).stores.map {
                                it.copy(verificationStatus = "unverified_mock")
                            }
                        )
                        return@withContext Result.success(mock)
                    }

                    val message = when (code) {
                        400 -> "Invalid search request. Please verify your query parameter."
                        401, 403 -> "Comparison service access is unauthorized."
                        404 -> "Comparison search endpoint not found."
                        429 -> "Too many search requests. Please wait before trying again."
                        in 500..599 -> "Comparison backend service is temporarily unavailable."
                        else -> "Comparison server returned HTTP $code."
                    }

                    return@withContext Result.failure(
                        ComparisonApiException(code, message, errBody)
                    )
                }
            } catch (e: IOException) {
                // Network error / offline disconnect: Check for honest cached data first
                val cached = getCached(cleanQuery)
                if (cached != null) {
                    val staleResponse = cached.response.copy(
                        recommendation = "[Offline Cache - Stale] Retrieved from cache (${cached.cachedAt}). Network connection is offline.",
                        stores = cached.response.stores.map { it.copy(verificationStatus = "verification_stale") }
                    )
                    return@withContext Result.success(staleResponse)
                }

                if (allowDevMockFallback) {
                    val mock = SmartMarketIntelligence.generateMarketComparison(cleanQuery).copy(
                        recommendation = "[Mock Fixture - Dev Mode] Unverified synthetic data for development only.",
                        stores = SmartMarketIntelligence.generateMarketComparison(cleanQuery).stores.map {
                            it.copy(verificationStatus = "unverified_mock")
                        }
                    )
                    return@withContext Result.success(mock)
                }

                return@withContext Result.failure(
                    ComparisonNetworkException("Network error connecting to comparison engine.", e)
                )
            } catch (e: Exception) {
                // Malformed JSON / HTML / Deserialization error
                return@withContext Result.failure(
                    ComparisonMalformedException("Failed to parse comparison response: ${e.localizedMessage}")
                )
            }
        }
    }
}
