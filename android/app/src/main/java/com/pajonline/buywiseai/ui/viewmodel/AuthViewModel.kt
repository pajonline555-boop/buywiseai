package com.pajonline.buywiseai.ui.viewmodel

import androidx.lifecycle.ViewModel
import com.pajonline.buywiseai.data.repository.AuthRepository
import com.pajonline.buywiseai.data.repository.AuthState
import kotlinx.coroutines.flow.StateFlow

class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    val authState: StateFlow<AuthState> = authRepository.authState

    fun checkAuthState() {
        authRepository.checkAuthState()
    }

    fun signInWithEmail(email: String, password: String, onResult: (Boolean, String) -> Unit) {
        authRepository.signInWithEmail(email, password, onResult)
    }

    fun signUpWithEmail(email: String, password: String, name: String, onResult: (Boolean, String) -> Unit) {
        authRepository.signUpWithEmail(email, password, name, onResult)
    }

    fun signOut() {
        authRepository.signOut()
    }

    fun sendPasswordResetEmail(email: String, onResult: (Boolean, String) -> Unit) {
        authRepository.sendPasswordResetEmail(email, onResult)
    }

    fun changePassword(newPassword: String, onResult: (Boolean, String) -> Unit) {
        authRepository.changePassword(newPassword, onResult)
    }

    fun signInWithGoogle(idToken: String? = null, email: String? = null, displayName: String? = null, onResult: (Boolean, String) -> Unit) {
        authRepository.signInWithGoogle(idToken, email, displayName, onResult)
    }
}
