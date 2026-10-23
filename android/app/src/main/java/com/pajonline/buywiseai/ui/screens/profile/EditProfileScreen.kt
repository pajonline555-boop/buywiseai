package com.pajonline.buywiseai.ui.screens.profile

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.data.repository.AuthRepository
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun EditProfileScreen(
    onSaveSuccess: () -> Unit = {}
) {
    val context = LocalContext.current
    val authRepo = remember { AuthRepository.getInstance() }
    val sharedPrefs = remember { context.getSharedPreferences("buywise_profile_prefs", Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()

    var displayName by remember { mutableStateOf(sharedPrefs.getString("saved_display_name", "") ?: "") }
    var email by remember { mutableStateOf(sharedPrefs.getString("saved_user_email", "") ?: "") }
    var mobileNumber by remember { mutableStateOf(sharedPrefs.getString("saved_user_phone", "") ?: "") }
    var preferredLanguage by remember { mutableStateOf(sharedPrefs.getString("saved_language", "English (en)") ?: "English (en)") }
    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("") }

    // Load latest profile from Firestore on open
    LaunchedEffect(Unit) {
        authRepo.loadUserProfileFromFirestore { name, mail, mobile, _ ->
            if (name.isNotBlank()) displayName = name
            if (mail.isNotBlank()) email = mail
            if (mobile.isNotBlank()) mobileNumber = mobile
            isLoading = false
        }
        // If no Firebase session, stop loading after timeout
        delay(3000)
        isLoading = false
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Text(
                text = "✏️ Edit Profile",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Your details are saved to your account",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Firestore sync badge
            Box(
                modifier = Modifier
                    .background(BuyWiseEmerald.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                    .border(1.dp, BuyWiseEmerald.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "🔄 Synced to Firebase — stays on all your devices",
                    fontSize = 11.sp,
                    color = BuyWiseEmerald,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (isLoading) {
                CircularProgressIndicator(color = BuyWiseCyan)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Loading your saved profile...", fontSize = 12.sp, color = Color.Gray)
            } else {

                // Display Name
                Text("Full Name", fontSize = 12.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Your name", color = Color.Gray) },
                    placeholder = { Text("e.g. Arjun Sharma", color = Color.DarkGray) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Email
                Text("Email Address", fontSize = 12.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Email", color = Color.Gray) },
                    placeholder = { Text("e.g. arjun@gmail.com", color = Color.DarkGray) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Mobile Number
                Text("Mobile Number", fontSize = 12.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = mobileNumber,
                    onValueChange = { if (it.length <= 13) mobileNumber = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Mobile (with country code)", color = Color.Gray) },
                    placeholder = { Text("e.g. +919876543210", color = Color.DarkGray) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseGold,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Language
                Text("Preferred Language", fontSize = 12.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = preferredLanguage,
                    onValueChange = { preferredLanguage = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Language", color = Color.Gray) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(28.dp))

                if (statusMessage.isNotBlank()) {
                    Text(
                        text = statusMessage,
                        fontSize = 12.sp,
                        color = if (statusMessage.startsWith("✅")) BuyWiseEmerald else Color(0xFFFF6B6B),
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }

                // Save Button
                Button(
                    onClick = {
                        if (displayName.isBlank()) {
                            statusMessage = "⚠️ Please enter your name"
                            return@Button
                        }
                        isSaving = true
                        statusMessage = ""

                        // 1. Save to local SharedPrefs immediately
                        sharedPrefs.edit()
                            .putString("saved_display_name", displayName.trim())
                            .putString("saved_user_email", email.trim())
                            .putString("saved_user_phone", mobileNumber.trim())
                            .putString("saved_language", preferredLanguage)
                            .apply()

                        // 2. Sync to Firebase Firestore
                        authRepo.syncUserProfileToFirestore(
                            email = email.trim(),
                            displayName = displayName.trim(),
                            mobileNumber = mobileNumber.trim()
                        )

                        // 3. Update linked mobile state & re-bind listeners
                        com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.syncDeviceToken(context)
                        com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.syncLinkedDeviceState(context)
                        com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.startRealtimeNotificationListener(context)
                        com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.startLinkedDeviceListener(context)

                        isSaving = false
                        statusMessage = "✅ Profile saved successfully!"
                        Toast.makeText(context, "Profile updated!", Toast.LENGTH_SHORT).show()

                        scope.launch {
                            delay(1000)
                            onSaveSuccess()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    enabled = !isSaving,
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = Color.Black, modifier = Modifier.height(20.dp))
                    } else {
                        Text(
                            text = "💾 SAVE PROFILE",
                            color = Color.Black,
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "🔒 Your data is stored securely in Firebase under your unique account ID. It is never shared with third parties.",
                    fontSize = 11.sp,
                    color = Color.Gray,
                    lineHeight = 16.sp
                )
            }
        }
    }
}
