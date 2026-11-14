package com.pajonline.buywiseai.ui.components

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.pajonline.buywiseai.core.update.AppVersionInfo
import com.pajonline.buywiseai.core.update.AppVersionManager
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold

@Composable
fun AppUpdateDialog(
    versionInfo: AppVersionInfo,
    onDismissOptional: () -> Unit = {},
    onRetry: () -> Unit = {}
) {
    val context = LocalContext.current
    val isMandatory = versionInfo.isMandatoryUpdate

    Dialog(
        onDismissRequest = {
            if (!isMandatory) {
                onDismissOptional()
            }
        },
        properties = DialogProperties(
            dismissOnBackPress = !isMandatory,
            dismissOnClickOutside = !isMandatory,
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF110D24)),
            shape = RoundedCornerShape(26.dp),
            border = BorderStroke(
                1.5.dp,
                if (isMandatory) BuyWiseGold.copy(alpha = 0.8f) else BuyWiseCyan.copy(alpha = 0.8f)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Glow badge icon
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .background(
                            brush = Brush.radialGradient(
                                if (isMandatory) listOf(Color(0xFFFF9900), Color(0xFF7A3600))
                                else listOf(Color(0xFF00E5FF), Color(0xFF0D47A1))
                            ),
                            shape = CircleShape
                        )
                        .border(
                            2.dp,
                            if (isMandatory) BuyWiseGold else BuyWiseCyan,
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (isMandatory) "⚠️" else "🚀", fontSize = 34.sp)
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = if (isMandatory) "Update Required" else "New Version Available",
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Build info badge
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF1B1536),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
                ) {
                    Text(
                        text = "Your Build: ${versionInfo.currentBuildNumber}  ➔  ${if (isMandatory) "Required: " + versionInfo.minimumSupportedVersion else "Latest: " + versionInfo.latestVersion}",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isMandatory) BuyWiseGold else BuyWiseCyan,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Admin update message box
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF17122E),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text("💬", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = versionInfo.updateMessage,
                            fontSize = 12.5.sp,
                            color = Color(0xFFE2E8F0),
                            lineHeight = 18.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Main Update Button
                Button(
                    onClick = {
                        try {
                            AppVersionManager.getInstance(context).launchPlayStore(context, versionInfo.updateUrl)
                        } catch (e: Throwable) {
                            android.util.Log.e("AppUpdateDialog", "Play Store launch note", e)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isMandatory) BuyWiseGold else BuyWiseCyan
                    )
                ) {
                    Text(
                        text = "🚀 UPDATE NOW",
                        color = Color.Black,
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (isMandatory) {
                    // For mandatory update, provide a check again / retry button
                    OutlinedButton(
                        onClick = onRetry,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f))
                    ) {
                        Text("🔄 Check Again", color = BuyWiseGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                    // For optional update, provide a clean "Later" dismissal button
                    OutlinedButton(
                        onClick = onDismissOptional,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Color.Gray.copy(alpha = 0.5f))
                    ) {
                        Text("Later", color = Color.LightGray, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
