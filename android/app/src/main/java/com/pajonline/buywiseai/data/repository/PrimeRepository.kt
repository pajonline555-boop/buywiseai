package com.pajonline.buywiseai.data.repository

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

sealed class PrimeState {
    object Loading : PrimeState()
    data class Active(
        val plan: String,
        val source: String,
        val expiresAt: String,
        val autoRenew: Boolean
    ) : PrimeState()
    object Free : PrimeState()
    data class Error(val message: String) : PrimeState()
}

class PrimeSubscriptionRepository {

    private val auth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (e: Exception) {
            null
        }
    }

    private val _primeState = MutableStateFlow<PrimeState>(PrimeState.Free)
    val primeState: StateFlow<PrimeState> = _primeState.asStateFlow()

    private val baseUrl = "https://buywiseai.pajonline.co.in"

    suspend fun fetchPrimeStatus(): PrimeState = withContext(Dispatchers.IO) {
        val user = auth?.currentUser
        if (user == null || user.uid.isBlank()) {
            _primeState.value = PrimeState.Free
            return@withContext PrimeState.Free
        }

        try {
            val url = URL("$baseUrl/api/prime/status?userId=${user.uid}&userEmail=${user.email ?: ""}")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000

            if (conn.responseCode == 200) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(responseText)
                if (json.optBoolean("success")) {
                    val entitlement = json.optJSONObject("entitlement")
                    val status = entitlement?.optString("status") ?: "FREE"
                    val plan = entitlement?.optString("plan") ?: "FREE"
                    val source = entitlement?.optString("source") ?: "NONE"
                    val expiresAt = entitlement?.optString("expiresAt") ?: ""
                    val autoRenew = entitlement?.optBoolean("autoRenew") ?: false

                    if (status == "ACTIVE" && plan != "FREE") {
                        val state = PrimeState.Active(plan, source, expiresAt, autoRenew)
                        _primeState.value = state
                        return@withContext state
                    }
                }
            }
            _primeState.value = PrimeState.Free
            return@withContext PrimeState.Free
        } catch (e: Exception) {
            _primeState.value = PrimeState.Free
            return@withContext PrimeState.Free
        }
    }

    suspend fun verifyGooglePlayPurchaseToken(
        purchaseToken: String,
        productId: String,
        onResult: (Boolean, String) -> Unit
    ) = withContext(Dispatchers.IO) {
        val user = auth?.currentUser
        if (user == null) {
            onResult(false, "User not authenticated.")
            return@withContext
        }

        try {
            val url = URL("$baseUrl/api/prime/google/verify")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 8000

            val jsonBody = JSONObject().apply {
                put("userId", user.uid)
                put("userEmail", user.email ?: "")
                put("purchaseToken", purchaseToken)
                put("productId", productId)
            }

            conn.outputStream.use { os ->
                os.write(jsonBody.toString().toByteArray())
            }

            if (conn.responseCode == 200) {
                fetchPrimeStatus()
                onResult(true, "Google Play purchase verified! Prime status activated.")
            } else {
                onResult(false, "Verification failed with server status ${conn.responseCode}")
            }
        } catch (e: Exception) {
            onResult(false, "Network exception during verification: ${e.localizedMessage}")
        }
    }
}
