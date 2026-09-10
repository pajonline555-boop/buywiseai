package com.pajonline.buywiseai.data.repository

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import java.util.UUID

class GoogleSignInHelper(private val context: Context) {

    private val credentialManager = CredentialManager.create(context)

    // Web Client ID from Firebase Auth Google Provider configuration
    private val webClientId = "460298583489-default.apps.googleusercontent.com"

    suspend fun performGoogleSignIn(onResult: (Boolean, String?, String?) -> Unit) = withContext(Dispatchers.Main) {
        try {
            val rawNonce = UUID.randomUUID().toString()
            val bytes = rawNonce.toByteArray()
            val md = MessageDigest.getInstance("SHA-256")
            val digest = md.digest(bytes)
            val hashedNonce = digest.fold("") { str, it -> str + "%02x".format(it) }

            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(webClientId)
                .setNonce(hashedNonce)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val response = credentialManager.getCredential(context = context, request = request)
            val credential = response.credential

            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                val email = googleIdTokenCredential.id
                val name = googleIdTokenCredential.displayName
                onResult(true, idToken, email)
            } else {
                onResult(false, null, "Google Sign-In credential returned unexpected format.")
            }
        } catch (e: GetCredentialCancellationException) {
            onResult(false, null, "Google sign-in cancelled.")
        } catch (e: Exception) {
            // Fallback for devices without Play Services Credential Manager
            onResult(false, null, "Credential Manager error: ${e.localizedMessage}")
        }
    }
}
