package com.pajonline.buywiseai.data.api

import com.pajonline.buywiseai.domain.model.ComparisonResponse
import com.pajonline.buywiseai.domain.model.Product
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

data class HealthResponse(
    val status: String,
    val brand: String? = null,
    val version: String? = null
)

data class CanonicalQuery(
    val rawInput: String,
    val title: String,
    val category: String? = null
)

data class ComparePostRequest(
    val canonical: CanonicalQuery,
    val mode: String = "exact"
)

data class ScrapeProductRequest(
    val url: String
)

data class VtoGenerateRequest(
    val userPhoto: String,
    val product: Product
)

data class VtoGenerateResponse(
    val success: Boolean,
    val resultImage: String? = null,
    val message: String? = null
)

interface BuyWiseApiService {

    @GET("/api/health")
    suspend fun getHealth(): Response<HealthResponse>

    @GET("/api/compare")
    suspend fun compareProducts(@Query("q") query: String): Response<ComparisonResponse>

    @POST("/api/compare")
    suspend fun compareProductsPost(@Body request: ComparePostRequest): Response<ComparisonResponse>

    @POST("/api/scrape-product")
    suspend fun scrapeProduct(@Body request: ScrapeProductRequest): Response<Map<String, Any>>

    @POST("/api/vto/generate")
    suspend fun generateVto(@Body request: VtoGenerateRequest): Response<VtoGenerateResponse>
}
