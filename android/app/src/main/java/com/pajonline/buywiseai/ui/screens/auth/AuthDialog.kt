package com.pajonline.buywiseai.ui.screens.auth

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.pajonline.buywiseai.R
import com.pajonline.buywiseai.data.repository.GoogleSignInHelper
import com.pajonline.buywiseai.ui.components.BuyWiseLogo
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import com.pajonline.buywiseai.ui.viewmodel.AuthViewModel

@Composable
fun MandatoryAuthScreen(
    onAuthSuccess: () -> Unit,
    authViewModel: AuthViewModel = remember { AuthViewModel() }
) {
    var isSignUp by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val webClientId = "226689194744-8hrg4spjt7aheiop94hi4pcs1gi66m54.apps.googleusercontent.com"

    val gsoWithToken = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
    }
    val googleSignInClientWithToken = remember(context) {
        GoogleSignIn.getClient(context, gsoWithToken)
    }

    val googleSignInLauncherWithToken = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val selectedEmail = account?.email
            val idToken = account?.idToken
            val displayName = account?.displayName
            if (!idToken.isNullOrBlank()) {
                authViewModel.signInWithGoogle(idToken = idToken, email = selectedEmail, displayName = displayName) { success, msg ->
                    isLoading = false
                    if (success) {
                        onAuthSuccess()
                    } else {
                        errorMessage = msg
                    }
                }
            } else {
                isLoading = false
                errorMessage = "Google sign-in error: ID token not returned by Google Play Services."
            }
        } catch (e: ApiException) {
            isLoading = false
            android.util.Log.w("BuyWiseGoogleSignIn", "Google Sign In ApiException code: ${e.statusCode}")
            if (e.statusCode == 12501 || e.statusCode == 16) {
                errorMessage = "Google sign-in was cancelled."
            } else if (e.statusCode == 10) {
                errorMessage = "Google Sign-In error (Developer Error 10: OAuth SHA-1 fingerprint mismatch in Firebase Console). Please verify Firebase setup."
            } else {
                errorMessage = "Google sign-in error (code ${e.statusCode}). Please try again."
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                BuyWiseLogo(logoHeight = 46.dp, fontSize = 28)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Shop Smarter. Buy Better.",
                    color = BuyWiseCyan,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(28.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF161228)),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, BuyWisePurple.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isSignUp) "Create Your BuyWise Account" else "Welcome Back! Sign In to BuyWise AI",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Access live prices, AI trial room & price drop alerts",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        // ACTIVE GOOGLE SIGN IN BUTTON
                        OutlinedButton(
                            onClick = {
                                isLoading = true
                                errorMessage = null
                                try {
                                    googleSignInClientWithToken.signOut().addOnCompleteListener {
                                        googleSignInLauncherWithToken.launch(googleSignInClientWithToken.signInIntent)
                                    }
                                } catch (e: Exception) {
                                    googleSignInLauncherWithToken.launch(googleSignInClientWithToken.signInIntent)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, Color(0xFF4285F4)),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF1E2235)),
                            enabled = !isLoading
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.ic_google_logo),
                                    contentDescription = "Google Logo",
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = if (isSignUp) "SIGN UP WITH GOOGLE" else "CONTINUE WITH GOOGLE",
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 13.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = Color.DarkGray)
                            Text(
                                text = "  OR WITH EMAIL  ",
                                color = Color.Gray,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f), color = Color.DarkGray)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        if (isSignUp) {
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("Full Name", color = Color.Gray) },
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan,
                                    unfocusedBorderColor = Color.DarkGray,
                                    focusedTextColor = Color.White
                                )
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Email Address", color = Color.Gray) },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                focusedTextColor = Color.White
                            )
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Password", color = Color.Gray) },
                            visualTransformation = PasswordVisualTransformation(),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                focusedTextColor = Color.White
                            )
                        )

                        errorMessage?.let { msg ->
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = msg, color = Color(0xFFFF6B6B), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        Button(
                            onClick = {
                                if (email.isBlank() || password.isBlank()) {
                                    errorMessage = "Please enter email and password."
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                if (isSignUp) {
                                    authViewModel.signUpWithEmail(email, password, name) { success, msg ->
                                        isLoading = false
                                        if (success) {
                                            onAuthSuccess()
                                        } else {
                                            errorMessage = msg
                                        }
                                    }
                                } else {
                                    authViewModel.signInWithEmail(email, password) { success, msg ->
                                        isLoading = false
                                        if (success) {
                                            onAuthSuccess()
                                        } else {
                                            errorMessage = msg
                                        }
                                    }
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !isLoading
                        ) {
                            Text(
                                text = if (isLoading) "PROCESSING..." else if (isSignUp) "CREATE MY ACCOUNT" else "SIGN IN TO BUYWISE",
                                color = Color.Black,
                                fontWeight = FontWeight.Black,
                                fontSize = 13.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        TextButton(onClick = { isSignUp = !isSignUp; errorMessage = null }) {
                            Text(
                                text = if (isSignUp) "Already have an account? Sign In" else "New to BuyWise AI? Create Account",
                                color = BuyWiseCyan,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🔒 256-Bit Encrypted • Verified Merchant Security", fontSize = 11.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AuthDialog(
    onDismiss: () -> Unit,
    onAuthSuccess: () -> Unit,
    authViewModel: AuthViewModel = remember { AuthViewModel() }
) {
    var isSignUp by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val webClientId = "226689194744-8hrg4spjt7aheiop94hi4pcs1gi66m54.apps.googleusercontent.com"

    val gsoWithToken = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
    }
    val googleSignInClientWithToken = remember(context) {
        GoogleSignIn.getClient(context, gsoWithToken)
    }

    val googleSignInLauncherWithToken = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val selectedEmail = account?.email
            val idToken = account?.idToken
            val displayName = account?.displayName
            if (!idToken.isNullOrBlank()) {
                authViewModel.signInWithGoogle(idToken = idToken, email = selectedEmail, displayName = displayName) { success, msg ->
                    isLoading = false
                    if (success) {
                        onAuthSuccess()
                    } else {
                        errorMessage = msg
                    }
                }
            } else {
                isLoading = false
                errorMessage = "Google sign-in error: ID token not returned by Google Play Services."
            }
        } catch (e: ApiException) {
            isLoading = false
            android.util.Log.w("BuyWiseGoogleSignIn", "Google Sign In ApiException code: ${e.statusCode}")
            if (e.statusCode == 12501 || e.statusCode == 16) {
                errorMessage = "Google sign-in was cancelled."
            } else if (e.statusCode == 10) {
                errorMessage = "Google Sign-In error (Developer Error 10: OAuth SHA-1 fingerprint mismatch in Firebase Console). Please verify Firebase setup."
            } else {
                errorMessage = "Google sign-in error (code ${e.statusCode}). Please try again."
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF191629)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (isSignUp) "Create BuyWise Account" else "Sign In to BuyWise AI",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = BuyWiseCyan
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Google Sign In / Sign Up Button
                OutlinedButton(
                    onClick = {
                        isLoading = true
                        errorMessage = null
                        try {
                            googleSignInClientWithToken.signOut().addOnCompleteListener {
                                googleSignInLauncherWithToken.launch(googleSignInClientWithToken.signInIntent)
                            }
                        } catch (e: Exception) {
                            googleSignInLauncherWithToken.launch(googleSignInClientWithToken.signInIntent)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0xFF4285F4)),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF1E2235)),
                    enabled = !isLoading
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_google_logo),
                            contentDescription = "Google Logo",
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isSignUp) "SIGN UP WITH GOOGLE" else "CONTINUE WITH GOOGLE",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color.DarkGray)
                    Text(
                        text = "  OR EMAIL  ",
                        color = Color.Gray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color.DarkGray)
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (isSignUp) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Full Name", color = Color.Gray) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BuyWiseCyan,
                            unfocusedBorderColor = Color.DarkGray,
                            focusedTextColor = Color.White
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Email Address", color = Color.Gray) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Password", color = Color.Gray) },
                    visualTransformation = PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White
                    )
                )

                var showForgotPasswordModal by remember { mutableStateOf(false) }
                var forgotEmail by remember { mutableStateOf("") }
                var forgotStatusMsg by remember { mutableStateOf<String?>(null) }

                if (!isSignUp) {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        TextButton(onClick = { showForgotPasswordModal = true; forgotEmail = email }) {
                            Text("Forgot Password?", color = BuyWiseCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (showForgotPasswordModal) {
                    AlertDialog(
                        onDismissRequest = { showForgotPasswordModal = false },
                        containerColor = Color(0xFF141026),
                        title = {
                            Text("🔑 Reset Password", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        },
                        text = {
                            Column {
                                Text("Enter your registered email address to receive password reset instructions:", color = Color.LightGray, fontSize = 13.sp)
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = forgotEmail,
                                    onValueChange = { forgotEmail = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    label = { Text("Email Address", color = Color.Gray) },
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = BuyWiseCyan,
                                        unfocusedBorderColor = Color.DarkGray,
                                        focusedTextColor = Color.White
                                    )
                                )
                                forgotStatusMsg?.let { msg ->
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(msg, color = BuyWiseEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    if (forgotEmail.isBlank()) {
                                        forgotStatusMsg = "Please enter your email address."
                                        return@Button
                                    }
                                    authViewModel.sendPasswordResetEmail(forgotEmail) { success, msg ->
                                        forgotStatusMsg = msg
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("SEND RESET LINK", color = Color.Black, fontWeight = FontWeight.Black)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showForgotPasswordModal = false }) {
                                Text("Close", color = Color.Gray)
                            }
                        }
                    )
                }

                errorMessage?.let { msg ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = msg, color = Color(0xFFFF6B6B), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Please enter email and password."
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        if (isSignUp) {
                            authViewModel.signUpWithEmail(email, password, name) { success, msg ->
                                isLoading = false
                                if (success) {
                                    onAuthSuccess()
                                } else {
                                    errorMessage = msg
                                }
                            }
                        } else {
                            authViewModel.signInWithEmail(email, password) { success, msg ->
                                isLoading = false
                                if (success) {
                                    onAuthSuccess()
                                } else {
                                    errorMessage = msg
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isLoading
                ) {
                    Text(
                        text = if (isLoading) "PROCESSING..." else if (isSignUp) "REGISTER ACCOUNT" else "SIGN IN",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = { isSignUp = !isSignUp; errorMessage = null }) {
                    Text(
                        text = if (isSignUp) "Already have an account? Sign In" else "New to BuyWise? Create Account",
                        color = BuyWiseCyan,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
