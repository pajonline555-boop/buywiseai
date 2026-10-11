package com.pajonline.buywiseai.data.repository

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.util.UUID

class GoogleSignInHelper(private val context: Context) {

    private val credentialManager = CredentialManager.create(context)

    // Web Client ID from Firebase Auth Google Provider configuration (google-services.json)
    private val webClientId = "226689194744-8hrg4spjt7aheiop94hi4pcs1gi66m54.apps.googleusercontent.com"

    fun signOutGoogle() {
        try {
            val gso = com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build()
            val client = com.google.android.gms.auth.api.signin.GoogleSignIn.getClient(context, gso)
            client.signOut()
            client.revokeAccess()
        } catch (e: Exception) {
            Log.w("BuyWiseGoogleSignIn", "Error clearing Google client session", e)
        }
    }

    suspend fun performGoogleSignIn(forceAccountPicker: Boolean = true, onResult: (Boolean, String?, String?) -> Unit) = withContext(Dispatchers.Main) {
        if (forceAccountPicker) {
            signOutGoogle()
        }

        try {
            Log.d("BuyWiseGoogleSignIn", "Starting Google CredentialManager request with webClientId: $webClientId")
            val rawNonce = UUID.randomUUID().toString()
            val bytes = rawNonce.toByteArray()
            val md = MessageDigest.getInstance("SHA-256")
            val digest = md.digest(bytes)
            val hashedNonce = digest.fold("") { str, it -> str + "%02x".format(it) }

            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(webClientId)
                .setNonce(hashedNonce)
                .setAutoSelectEnabled(false)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val response = credentialManager.getCredential(context = context, request = request)
            val credential = response.credential

            Log.d("BuyWiseGoogleSignIn", "Credential received: ${credential.type}")

            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                val email = googleIdTokenCredential.id
                Log.d("BuyWiseGoogleSignIn", "Google ID token retrieved successfully for $email")
                onResult(true, idToken, email)
                return@withContext
            } else {
                Log.w("BuyWiseGoogleSignIn", "Unexpected credential format: ${credential.type}")
            }
        } catch (e: GetCredentialCancellationException) {
            Log.i("BuyWiseGoogleSignIn", "User cancelled Google sign in account picker")
            onResult(false, null, null)
            return@withContext
        } catch (e: Exception) {
            Log.w("BuyWiseGoogleSignIn", "GetGoogleIdOption exception: ${e.javaClass.name} - ${e.localizedMessage}")
        }

        // Secondary CredentialManager Option: GetSignInWithGoogleOption fallback
        try {
            val signInOption = GetSignInWithGoogleOption.Builder(webClientId).build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInOption)
                .build()
            val response = credentialManager.getCredential(context = context, request = request)
            val credential = response.credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                val email = googleIdTokenCredential.id
                Log.d("BuyWiseGoogleSignIn", "GetSignInWithGoogleOption token retrieved for $email")
                onResult(true, idToken, email)
                return@withContext
            }
        } catch (e: GetCredentialCancellationException) {
            Log.i("BuyWiseGoogleSignIn", "User cancelled Google sign in account picker")
            onResult(false, null, null)
            return@withContext
        } catch (e: Exception) {
            Log.w("BuyWiseGoogleSignIn", "GetSignInWithGoogleOption exception: ${e.localizedMessage}")
        }

        Log.w("BuyWiseGoogleSignIn", "No Google account selected or retrieved from CredentialManager")
        onResult(false, null, null)
    }
}
