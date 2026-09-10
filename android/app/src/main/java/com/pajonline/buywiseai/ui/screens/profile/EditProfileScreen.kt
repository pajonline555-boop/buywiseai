package com.pajonline.buywiseai.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan

@Composable
fun EditProfileScreen(
    onSaveSuccess: () -> Unit = {}
) {
    var displayName by remember { mutableStateOf("Shopper") }
    var preferredCurrency by remember { mutableStateOf("INR") }
    var preferredLanguage by remember { mutableStateOf("English (en)") }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(
                text = "Edit Profile & Preferences",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Matches Firestore users/{uid} schema",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(20.dp))

            OutlinedTextField(
                value = displayName,
                onValueChange = { displayName = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Display Name", color = Color.Gray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BuyWiseCyan,
                    unfocusedBorderColor = Color.DarkGray,
                    focusedTextColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = preferredCurrency,
                onValueChange = { preferredCurrency = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Currency (Default: INR)", color = Color.Gray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BuyWiseCyan,
                    unfocusedBorderColor = Color.DarkGray,
                    focusedTextColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = preferredLanguage,
                onValueChange = { preferredLanguage = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Language", color = Color.Gray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BuyWiseCyan,
                    unfocusedBorderColor = Color.DarkGray,
                    focusedTextColor = Color.White
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { onSaveSuccess() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(text = "SAVE CHANGES", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
