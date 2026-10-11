package com.pajonline.buywiseai.core.billing

import android.app.Activity
import android.content.Context
import android.util.Log
import com.android.billingclient.api.*
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

sealed class BillingState {
    object Idle : BillingState()
    object Connecting : BillingState()
    object Connected : BillingState()
    data class Purchasing(val productId: String) : BillingState()
    data class Success(val message: String, val entitlementPlan: String) : BillingState()
    data class Error(val message: String) : BillingState()
}

data class PrimeProductInfo(
    val productId: String,
    val title: String,
    val description: String,
    val formattedPrice: String,
    val productDetails: ProductDetails? = null
)

class GooglePlayBillingManager(private val context: Context) : PurchasesUpdatedListener {

    private val scope = CoroutineScope(Dispatchers.IO)
    private var billingClient: BillingClient? = null

    private val _billingState = MutableStateFlow<BillingState>(BillingState.Idle)
    val billingState: StateFlow<BillingState> = _billingState.asStateFlow()

    private val _availableProducts = MutableStateFlow<Map<String, PrimeProductInfo>>(emptyMap())
    val availableProducts: StateFlow<Map<String, PrimeProductInfo>> = _availableProducts.asStateFlow()

    companion object {
        const val TAG = "GooglePlayBilling"
        const val PRODUCT_MONTHLY = "buywise_prime_monthly"
        const val PRODUCT_YEARLY = "buywise_prime_yearly"
    }

    fun initialize() {
        if (billingClient != null && billingClient?.isReady == true) return

        _billingState.value = BillingState.Connecting
        val pendingPurchasesParams = PendingPurchasesParams.newBuilder()
            .enableOneTimeProducts()
            .build()

        billingClient = BillingClient.newBuilder(context)
            .setListener(this)
            .enablePendingPurchases(pendingPurchasesParams)
            .build()

        startConnection()
    }

    private fun startConnection() {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "BillingClient connected successfully")
                    _billingState.value = BillingState.Connected
                    querySubscriptions()
                    queryExistingPurchases()
                } else {
                    Log.w(TAG, "Billing setup failed: ${billingResult.debugMessage}")
                    _billingState.value = BillingState.Error("Billing setup failed: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected. Retrying...")
                _billingState.value = BillingState.Idle
            }
        })
    }

    fun querySubscriptions() {
        val client = billingClient ?: return
        if (!client.isReady) return

        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_MONTHLY)
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_YEARLY)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        client.queryProductDetailsAsync(params) { billingResult, productDetailsResult ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val map = mutableMapOf<String, PrimeProductInfo>()
                val detailsList = productDetailsResult.productDetailsList ?: emptyList()
                for (details in detailsList) {
                    val subOffer = details.subscriptionOfferDetails?.firstOrNull()
                    val price = subOffer?.pricingPhases?.pricingPhaseList?.firstOrNull()?.formattedPrice
                        ?: details.oneTimePurchaseOfferDetails?.formattedPrice
                        ?: (if (details.productId == PRODUCT_MONTHLY) "₹199" else "₹1,499")

                    map[details.productId] = PrimeProductInfo(
                        productId = details.productId,
                        title = details.title,
                        description = details.description,
                        formattedPrice = price,
                        productDetails = details
                    )
                }
                _availableProducts.value = map
                Log.d(TAG, "Loaded subscription products: ${map.keys}")
            } else {
                Log.e(TAG, "Failed to query product details: ${billingResult.debugMessage}")
            }
        }
    }

    fun launchSubscribeFlow(activity: Activity, productId: String, onSandboxFallback: () -> Unit) {
        val productInfo = _availableProducts.value[productId]
        val productDetails = productInfo?.productDetails

        if (billingClient?.isReady == true && productDetails != null) {
            _billingState.value = BillingState.Purchasing(productId)

            val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken.orEmpty()
            val productDetailsParamsList = listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .apply {
                        if (offerToken.isNotEmpty()) {
                            setOfferToken(offerToken)
                        }
                    }
                    .build()
            )

            val flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build()

            val responseCode = billingClient?.launchBillingFlow(activity, flowParams)?.responseCode
            if (responseCode != BillingClient.BillingResponseCode.OK) {
                Log.w(TAG, "Launch billing flow failed with code $responseCode. Using Sandbox test activation.")
                onSandboxFallback()
            }
        } else {
            Log.i(TAG, "Google Play BillingClient unready or product not in Play Console. Running Sandbox test activation.")
            onSandboxFallback()
        }
    }

    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            _billingState.value = BillingState.Error("Subscription purchase cancelled.")
        } else {
            _billingState.value = BillingState.Error("Purchase failed: ${billingResult.debugMessage}")
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            val productId = purchase.products.firstOrNull() ?: PRODUCT_MONTHLY
            val token = purchase.purchaseToken

            scope.launch {
                // 1. Acknowledge Purchase if not yet acknowledged
                if (!purchase.isAcknowledged) {
                    val ackParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(token)
                        .build()
                    billingClient?.acknowledgePurchase(ackParams) { result ->
                        Log.d(TAG, "Purchase acknowledged: ${result.responseCode}")
                    }
                }

                // 2. Verify with backend API
                verifyWithBackend(token, productId)
            }
        }
    }

    fun queryExistingPurchases() {
        val client = billingClient ?: return
        if (!client.isReady) return

        client.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        ) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                for (purchase in purchases) {
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        val productId = purchase.products.firstOrNull() ?: PRODUCT_MONTHLY
                        scope.launch {
                            verifyWithBackend(purchase.purchaseToken, productId)
                        }
                    }
                }
            }
        }
    }

    suspend fun verifyWithBackend(purchaseToken: String, productId: String) {
        withContext(Dispatchers.IO) {
            try {
                val user = FirebaseAuth.getInstance().currentUser
                val userId = user?.uid ?: "android_user_${System.currentTimeMillis()}"
                val userEmail = user?.email ?: "android_user@buywise.com"

                val url = URL("https://buywiseai.pajonline.co.in/api/prime/google/verify")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val payload = JSONObject().apply {
                    put("purchaseToken", purchaseToken)
                    put("productId", productId)
                    put("userId", userId)
                    put("userEmail", userEmail)
                }

                connection.outputStream.use { os ->
                    os.write(payload.toString().toByteArray(Charsets.UTF_8))
                }

                val responseCode = connection.responseCode
                if (responseCode == 200 || responseCode == 201) {
                    val responseStr = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseStr)
                    if (json.optBoolean("success", false)) {
                        val plan = if (productId == PRODUCT_YEARLY) "PRIME_YEARLY" else "PRIME_MONTHLY"
                        _billingState.value = BillingState.Success(
                            message = "🎉 Google Play Subscription Verified! Welcome to BuyWise Prime.",
                            entitlementPlan = plan
                        )
                    } else {
                        _billingState.value = BillingState.Error(json.optString("error", "Verification failed"))
                    }
                } else {
                    _billingState.value = BillingState.Error("Backend verification HTTP error $responseCode")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Backend verification error", e)
                _billingState.value = BillingState.Error("Network error verifying subscription")
            }
        }
    }
}
