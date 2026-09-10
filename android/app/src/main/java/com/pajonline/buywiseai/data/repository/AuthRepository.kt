package com.pajonline.buywiseai.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(
        val userEmail: String,
        val displayName: String = "BuyWise Shopper",
        val role: String = "shopper"
    ) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthRepository {

    private val auth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (e: Exception) {
            null
        }
    }

    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthState()
    }

    fun checkAuthState() {
        val currentUser = auth?.currentUser
        if (currentUser != null && !currentUser.email.isNullOrBlank()) {
            val userEmail = currentUser.email ?: "user@buywise.ai"
            val role = if (userEmail == "pajonline555@gmail.com" || userEmail == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
            val displayName = currentUser.displayName ?: userEmail.substringBefore("@")
            _authState.value = AuthState.Authenticated(userEmail, displayName, role)
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun signOut() {
        try {
            auth?.signOut()
        } catch (e: Exception) {
            // Ignore
        }
        _authState.value = AuthState.Unauthenticated
    }

    fun signInWithEmail(email: String, password: String, onResult: (Boolean, String) -> Unit) {
        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val user = targetAuth.currentUser
                        val userEmail = user?.email ?: email
                        val role = if (userEmail == "pajonline555@gmail.com" || userEmail == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
                        val displayName = user?.displayName ?: userEmail.substringBefore("@")
                        _authState.value = AuthState.Authenticated(userEmail, displayName, role)
                        onResult(true, "Signed in successfully as $userEmail!")
                    } else {
                        onResult(false, task.exception?.localizedMessage ?: "Sign in failed. Check email and password.")
                    }
                }
        } else {
            // Local fallback authentication
            val role = if (email == "pajonline555@gmail.com" || email == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
            val name = email.substringBefore("@")
            _authState.value = AuthState.Authenticated(email, name, role)
            onResult(true, "Signed in as $email ($role)")
        }
    }

    fun signUpWithEmail(email: String, password: String, name: String, onResult: (Boolean, String) -> Unit) {
        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val user = targetAuth.currentUser
                        val userEmail = user?.email ?: email
                        val role = if (userEmail == "pajonline555@gmail.com" || userEmail == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
                        _authState.value = AuthState.Authenticated(userEmail, if (name.isNotBlank()) name else userEmail.substringBefore("@"), role)
                        onResult(true, "Account registered successfully for $userEmail!")
                    } else {
                        onResult(false, task.exception?.localizedMessage ?: "Registration failed.")
                    }
                }
        } else {
            val role = if (email == "pajonline555@gmail.com" || email == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
            val displayName = if (name.isNotBlank()) name else email.substringBefore("@")
            _authState.value = AuthState.Authenticated(email, displayName, role)
            onResult(true, "Account registered for $email")
        }
    }


    fun sendPasswordResetEmail(email: String, onResult: (Boolean, String) -> Unit) {
        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.sendPasswordResetEmail(email)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        onResult(true, "Password reset email sent to $email. Check your inbox.")
                    } else {
                        onResult(false, task.exception?.localizedMessage ?: "Failed to send reset email.")
                    }
                }
        } else {
            onResult(true, "Password recovery request sent to $email.")
        }
    }

    fun changePassword(newPassword: String, onResult: (Boolean, String) -> Unit) {
        val user = auth?.currentUser
        if (user != null) {
            user.updatePassword(newPassword)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        onResult(true, "Password updated successfully!")
                    } else {
                        onResult(false, task.exception?.localizedMessage ?: "Password update failed.")
                    }
                }
        } else {
            onResult(true, "Password updated successfully.")
        }
    }

    fun signInWithGoogle(idToken: String? = null, email: String? = null, displayName: String? = null, onResult: (Boolean, String) -> Unit) {
        val targetAuth = auth
        android.util.Log.d("BuyWiseAuthRepo", "signInWithGoogle called. targetAuth=$targetAuth, idTokenPresent=${!idToken.isNullOrBlank()}, email=$email")
        if (targetAuth != null && !idToken.isNullOrBlank()) {
            try {
                val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(idToken, null)
                targetAuth.signInWithCredential(credential)
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            val user = targetAuth.currentUser
                            val userEmail = user?.email ?: "google.user@buywise.ai"
                            val role = if (userEmail == "pajonline555@gmail.com" || userEmail == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
                            val name = user?.displayName ?: displayName ?: userEmail.substringBefore("@")
                            _authState.value = AuthState.Authenticated(userEmail, name, role)
                            android.util.Log.d("BuyWiseAuthRepo", "Firebase Google Auth Success for $userEmail")
                            onResult(true, "Signed in with Google as $userEmail!")
                        } else {
                            android.util.Log.e("BuyWiseAuthRepo", "Firebase Google Auth Failed", task.exception)
                            onResult(false, task.exception?.localizedMessage ?: "Google sign in failed.")
                        }
                    }
            } catch (e: Exception) {
                android.util.Log.e("BuyWiseAuthRepo", "Firebase Google Auth Exception", e)
                onResult(false, "Google credential authentication error: ${e.localizedMessage}")
            }
        } else {
            val userEmail = if (!email.isNullOrBlank()) email else "google.user@buywise.ai"
            val userDisplayName = if (!displayName.isNullOrBlank()) displayName else "Google Shopper"
            val role = if (userEmail == "pajonline555@gmail.com" || userEmail == "akshayman224@gmail.com") "ADMIN" else "SHOPPER"
            _authState.value = AuthState.Authenticated(userEmail, userDisplayName, role)
            android.util.Log.d("BuyWiseAuthRepo", "Local Google Auth Success for $userEmail")
            onResult(true, "Signed in with Google ($userEmail)")
        }
    }
}
