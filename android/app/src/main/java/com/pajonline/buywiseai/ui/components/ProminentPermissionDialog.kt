package com.pajonline.buywiseai.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan

@Composable
fun ProminentPermissionDialog(
    permissionType: String, // "CAMERA" or "NOTIFICATION"
    onGrant: () -> Unit,
    onDismiss: () -> Unit
) {
    val title = if (permissionType == "CAMERA") "📷 Camera Disclosure (Play Store Policy)" else "🔔 Notification Disclosure"
    val purpose = if (permissionType == "CAMERA") {
        "BuyWise AI requires camera access to allow you to take photos for AI Visual Product Search and AI Virtual Try-On."
    } else {
        "BuyWise AI requires notification permission to alert you when tracked product prices drop below your specified threshold."
    }
    val dataHandling = if (permissionType == "CAMERA") {
        "Your photo is processed locally on your device or via encrypted API and is NEVER sold or shared with third-party ad networks in compliance with India DPDP Act 2023 & Rules 2025."
    } else {
        "Notification tokens are used strictly for delivering price drop alerts. No background tracking is performed."
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF141026),
        title = {
            Text(
                text = title,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        },
        text = {
            Column {
                Text(
                    text = purpose,
                    color = Color.White,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = dataHandling,
                        color = Color.LightGray,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(10.dp),
                        lineHeight = 16.sp
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onGrant,
                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("AGREE & CONTINUE", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Not Now", color = Color.Gray)
            }
        }
    )
}
