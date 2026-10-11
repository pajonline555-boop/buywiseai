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

class AuthRepository private constructor() {

    companion object {
        @Volatile
        private var INSTANCE: AuthRepository? = null

        fun getInstance(): AuthRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AuthRepository().also { INSTANCE = it }
            }
        }
    }

    private fun determineRole(identifier: String?): String {
        if (identifier.isNullOrBlank()) return "SHOPPER"
        val clean = identifier.lowercase().trim()
        if (clean == "pajonline555@gmail.com" || clean == "akshayman224@gmail.com") {
            return "ADMIN"
        }
        return "SHOPPER"
    }

    private val auth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (e: Exception) {
            null
        }
    }

    private var isExplicitSignedOut = false

    private val _authState = MutableStateFlow<AuthState>(
        auth?.currentUser?.let { user ->
            val userEmail = user.email ?: user.phoneNumber ?: ""
            val role = determineRole(userEmail)
            val displayName = user.displayName ?: userEmail.substringBefore("@")
            AuthState.Authenticated(userEmail, displayName, role)
        } ?: AuthState.Unauthenticated
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthState()
    }

    fun checkAuthState() {
        val currentUser = auth?.currentUser
        if (currentUser != null && (!currentUser.email.isNullOrBlank() || !currentUser.phoneNumber.isNullOrBlank())) {
            isExplicitSignedOut = false
            val userEmail = currentUser.email ?: currentUser.phoneNumber ?: ""
            val role = determineRole(currentUser.email ?: currentUser.phoneNumber)
            val displayName = currentUser.displayName ?: userEmail.substringBefore("@")
            _authState.value = AuthState.Authenticated(userEmail, displayName, role)
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun syncUserProfileToFirestore(
        email: String,
        displayName: String,
        role: String = "SHOPPER",
        theme: String = "Dark Mode",
        language: String = "en"
    ) {
        val currentUser = auth?.currentUser ?: return
        val uid = currentUser.uid
        if (uid.isBlank()) return

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val userMap = hashMapOf(
                "uid" to uid,
                "email" to email,
                "displayName" to displayName,
                "role" to role,
                "themePreference" to theme,
                "languagePreference" to language,
                "lastLoginAt" to System.currentTimeMillis()
            )
            db.collection("users").document(uid)
                .set(userMap, com.google.firebase.firestore.SetOptions.merge())
        } catch (e: Exception) {
            android.util.Log.w("BuyWiseAuthRepo", "Firestore sync notice: ${e.localizedMessage}")
        }
    }

    fun signOut() {
        isExplicitSignedOut = true
        try {
            auth?.signOut()
        } catch (e: Exception) {
            // Ignore
        }
        _authState.value = AuthState.Unauthenticated
    }

    fun signInWithEmail(email: String, password: String, onResult: (Boolean, String) -> Unit) {
        isExplicitSignedOut = false
        val cleanEmail = email.lowercase().trim()

        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.signInWithEmailAndPassword(cleanEmail, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val user = targetAuth.currentUser
                        val userEmail = user?.email ?: cleanEmail
                        val role = determineRole(userEmail)
                        val displayName = user?.displayName ?: userEmail.substringBefore("@")
                        _authState.value = AuthState.Authenticated(userEmail, displayName, role)
                        syncUserProfileToFirestore(userEmail, displayName, role)
                        onResult(true, "Signed in successfully as $userEmail!")
                    } else {
                        _authState.value = AuthState.Unauthenticated
                        val errMessage = task.exception?.localizedMessage ?: "Incorrect email or password."
                        onResult(false, errMessage)
                    }
                }
        } else {
            _authState.value = AuthState.Unauthenticated
            onResult(false, "Firebase Auth service unavailable.")
        }
    }

    fun signUpWithEmail(email: String, password: String, name: String, onResult: (Boolean, String) -> Unit) {
        isExplicitSignedOut = false
        val cleanEmail = email.lowercase().trim()
        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.createUserWithEmailAndPassword(cleanEmail, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val user = targetAuth.currentUser
                        val userEmail = user?.email ?: cleanEmail
                        val role = determineRole(userEmail)
                        val displayName = if (name.isNotBlank()) name else userEmail.substringBefore("@")
                        _authState.value = AuthState.Authenticated(userEmail, displayName, role)
                        syncUserProfileToFirestore(userEmail, displayName, role)
                        onResult(true, "Account registered successfully for $userEmail!")
                    } else {
                        _authState.value = AuthState.Unauthenticated
                        val errMessage = task.exception?.localizedMessage ?: "Registration failed."
                        onResult(false, errMessage)
                    }
                }
        } else {
            _authState.value = AuthState.Unauthenticated
            onResult(false, "Firebase Auth service unavailable.")
        }
    }


    fun sendPasswordResetEmail(email: String, onResult: (Boolean, String) -> Unit) {
        val cleanEmail = email.lowercase().trim()
        val targetAuth = auth
        if (targetAuth != null) {
            targetAuth.sendPasswordResetEmail(cleanEmail)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        onResult(true, "Password reset email sent to $cleanEmail. Check your inbox.")
                    } else {
                        onResult(false, task.exception?.localizedMessage ?: "Failed to send password reset email.")
                    }
                }
        } else {
            onResult(false, "Firebase Auth service unavailable.")
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
                        onResult(false, task.exception?.localizedMessage ?: "Failed to update password.")
                    }
                }
        } else {
            onResult(false, "No authenticated user session found.")
        }
    }

    fun signInWithGoogle(idToken: String? = null, email: String? = null, displayName: String? = null, onResult: (Boolean, String) -> Unit) {
        isExplicitSignedOut = false
        if (idToken.isNullOrBlank()) {
            _authState.value = AuthState.Unauthenticated
            onResult(false, "Google authentication failed: missing ID token.")
            return
        }
        
        val targetAuth = auth
        if (targetAuth != null) {
            try {
                val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(idToken, null)
                targetAuth.signInWithCredential(credential)
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            val user = targetAuth.currentUser
                            val userEmail = user?.email ?: email ?: ""
                            val userDisplayName = user?.displayName ?: displayName ?: userEmail.substringBefore("@")
                            val role = determineRole(userEmail)
                            _authState.value = AuthState.Authenticated(userEmail, userDisplayName, role)
                            syncUserProfileToFirestore(userEmail, userDisplayName, role)
                            onResult(true, "Signed in with Google as $userEmail")
                        } else {
                            _authState.value = AuthState.Unauthenticated
                            val err = task.exception?.localizedMessage ?: "Firebase credential validation failed."
                            onResult(false, "Google authentication failed: $err")
                        }
                    }
            } catch (e: Exception) {
                _authState.value = AuthState.Unauthenticated
                onResult(false, "Google authentication error: ${e.localizedMessage}")
            }
        } else {
            _authState.value = AuthState.Unauthenticated
            onResult(false, "Firebase Auth service unavailable.")
        }
    }
}
