package com.pajonline.buywiseai.ui.viewmodel

import android.app.Activity
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.pajonline.buywiseai.core.billing.BillingState
import com.pajonline.buywiseai.core.billing.GooglePlayBillingManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class PrimeUiState(
    val selectedPlan: String = GooglePlayBillingManager.PRODUCT_MONTHLY,
    val isPrimeActive: Boolean = false,
    val planName: String = "FREE",
    val expiresAtFormatted: String = "",
    val isLoading: Boolean = false,
    val statusMessage: String? = null,
    val isError: Boolean = false
)

class PrimeViewModel : ViewModel() {

    private var billingManager: GooglePlayBillingManager? = null

    private val _uiState = MutableStateFlow(PrimeUiState())
    val uiState: StateFlow<PrimeUiState> = _uiState.asStateFlow()

    val billingState: StateFlow<BillingState>?
        get() = billingManager?.billingState

    fun initBilling(context: Context) {
        if (billingManager == null) {
            billingManager = GooglePlayBillingManager(context.applicationContext)
            billingManager?.initialize()
            checkEntitlementStatus()
        }
    }

    fun selectPlan(productId: String) {
        _uiState.value = _uiState.value.copy(selectedPlan = productId)
    }

    fun checkEntitlementStatus() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val user = FirebaseAuth.getInstance().currentUser ?: return@launch
                val url = URL("https://buywiseai.pajonline.co.in/api/prime/status?userId=${user.uid}&userEmail=${user.email}")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"

                if (connection.responseCode == 200) {
                    val responseStr = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseStr)
                    if (json.optBoolean("success", false)) {
                        val entitlement = json.optJSONObject("entitlement")
                        val status = entitlement?.optString("status") ?: "FREE"
                        val plan = entitlement?.optString("plan") ?: "FREE"
                        val expiresAt = entitlement?.optString("expiresAt") ?: ""

                        val isActive = status == "ACTIVE" && plan != "FREE"
                        _uiState.value = _uiState.value.copy(
                            isPrimeActive = isActive,
                            planName = if (isActive) plan else "FREE",
                            expiresAtFormatted = expiresAt
                        )
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun purchaseSelectedPlan(activity: Activity) {
        val currentPlan = _uiState.value.selectedPlan
        _uiState.value = _uiState.value.copy(isLoading = true, statusMessage = null)

        billingManager?.launchSubscribeFlow(
            activity = activity,
            productId = currentPlan,
            onSandboxFallback = {
                // If Play Billing fails or running in test sandbox mode, trigger sandbox verification
                activateSandboxTestMode(currentPlan)
            }
        )
    }

    private fun activateSandboxTestMode(productId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val user = FirebaseAuth.getInstance().currentUser
                val userId = user?.uid ?: "test_android_user"
                val userEmail = user?.email ?: "test@buywise.com"
                val token = "sandbox_token_android_${System.currentTimeMillis()}"

                val url = URL("https://buywiseai.pajonline.co.in/api/prime/google/verify")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val payload = JSONObject().apply {
                    put("purchaseToken", token)
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
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isPrimeActive = true,
                            planName = if (productId == GooglePlayBillingManager.PRODUCT_YEARLY) "PRIME_YEARLY" else "PRIME_MONTHLY",
                            statusMessage = "🎉 Google Play Subscription Activated! Welcome to BuyWise Prime.",
                            isError = false
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            statusMessage = json.optString("error", "Activation failed"),
                            isError = true
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "Activation server error ($responseCode)",
                        isError = true
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    statusMessage = "Network error: ${e.localizedMessage}",
                    isError = true
                )
            }
        }
    }
}
