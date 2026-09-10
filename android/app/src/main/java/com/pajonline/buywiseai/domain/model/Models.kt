package com.pajonline.buywiseai.domain.model

data class StoreOffer(
    val id: String,
    val retailerId: String? = null,
    val store: String,
    val title: String,
    val url: String,
    val price: Double,
    val currency: String = "INR",
    val originalPrice: Double? = null,
    val mrp: Double? = null,
    val discount: Double? = null,
    val imageUrl: String? = null,
    val logo: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null,
    val availability: String? = "unknown",
    val sellerName: String? = null,
    val deliveryText: String? = null,
    val isLowest: Boolean? = false,
    val isBestValue: Boolean? = false,
    val isBestMatch: Boolean? = false,
    val matchType: String? = null,
    val smartValueScore: Int? = null,
    val trustScore: Int? = null,
    val verificationStatus: String? = null,
    val tryOnEnabled: Boolean? = false,
    val productSource: String? = "AFFILIATE",
    val fulfillmentType: String? = "EXTERNAL_RETAILER",
    val shippingEstimate: String? = "4–7 Business Days",
    val returnPolicy: String? = "7-Day Return Policy"
)

data class ComparisonSummary(
    val totalStoresChecked: Int = 14,
    val successfulStores: Int = 0,
    val lowestPrice: Double = 0.0,
    val highestPrice: Double = 0.0,
    val maximumSavings: Double = 0.0,
    val currency: String = "INR"
)

data class ComparisonResponse(
    val product: String? = null,
    val query: String? = null,
    val timestamp: String? = null,
    val stores: List<StoreOffer> = emptyList(),
    val summary: ComparisonSummary? = null,
    val recommendation: String? = null
)

data class Product(
    val id: String,
    val title: String,
    val price: Double,
    val mrp: Double? = null,
    val retailer: String,
    val primaryImage: String,
    val category: String,
    val affiliateUrl: String? = null,
    val effectivePrice: Double? = null,
    val couponCode: String? = null,
    val trustScore: Int = 95,
)

data class Coupon(
    val id: String,
    val code: String,
    val description: String,
    val discountAmount: Double,
    val freshnessStatus: String, // VERIFIED_TODAY | UNVERIFIED | EXPIRED
    val retailer: String,
)

data class VtoLook(
    val id: String,
    val createdAt: Long,
    val type: String, // USER_PHOTO | VTO_RESULT
    val imageUriOrPath: String,
    val productId: String? = null,
    val isPrimary: Boolean = false,
    val isCompetitionSubmitted: Boolean = false,
)

data class PartnerOrder(
    val id: String,
    val orderNumber: String,
    val partnerId: String,
    val partnerName: String,
    val totalAmount: Double,
    val orderStatus: String, // NEW_ORDER -> ACCEPTED -> PACKING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
    val createdAt: String,
)

data class MediaReviewRequest(
    val reviewId: String,
    val userId: String,
    val vtoResultId: String,
    val reason: String,
    val permissionType: String,
    val authorizedAt: Long,
    val expiresAt: Long,
    val status: String,
)
