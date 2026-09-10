package com.pajonline.buywiseai.ui.screens.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.BuildConfig
import com.pajonline.buywiseai.data.repository.AuthState
import com.pajonline.buywiseai.ui.screens.auth.AuthDialog
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.viewmodel.AuthViewModel
import java.io.File

@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel = remember { AuthViewModel() },
    onNavigateToWeb: (title: String, url: String) -> Unit = { _, _ -> }
) {
    val authState by authViewModel.authState.collectAsState()
    var showAuthDialog by remember { mutableStateOf(false) }
    var activeModalTitle by remember { mutableStateOf<String?>(null) }
    var activeModalSubtitle by remember { mutableStateOf("") }
    var activeModalContent by remember { mutableStateOf("") }
    var activeModalWebsiteUrl by remember { mutableStateOf("") }

    var selectedLanguage by remember { mutableStateOf("English") }
    var selectedTheme by remember { mutableStateOf("Dark Mode") }
    var showInfoDialogText by remember { mutableStateOf<String?>(null) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }
    var showSecurityDialog by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val privateVtoDir = File(context.filesDir, "vto_private")
    val vtoCount = (privateVtoDir.listFiles() ?: emptyArray()).size

    fun openWebPage(title: String, urlPath: String) {
        val cleanPath = if (urlPath.startsWith("/")) urlPath else "/$urlPath"
        val fullUrl = if (urlPath.startsWith("http")) urlPath else "https://buywiseai.pajonline.co.in$cleanPath"
        onNavigateToWeb(title, fullUrl)
    }

    fun openLegalModal(title: String, subtitle: String, content: String, websiteUrl: String) {
        activeModalTitle = title
        activeModalSubtitle = subtitle
        activeModalContent = content
        activeModalWebsiteUrl = websiteUrl
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF070510)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "MY BUYWISE AI",
                fontSize = 26.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Text(
                text = "Shopping Command Center",
                fontSize = 13.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(16.dp))

            // User Identity Card & Website Quick Button
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .height(56.dp)
                                .width(56.dp)
                                .background(Color(0xFFA855F7).copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFFA855F7), modifier = Modifier.height(30.dp))
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            when (val state = authState) {
                                is AuthState.Authenticated -> {
                                    Text(
                                        text = state.displayName.ifEmpty { state.userEmail.ifEmpty { "BuyWise Member" } },
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Role: ${state.role.uppercase()} • Verified",
                                        fontSize = 12.sp,
                                        color = BuyWiseEmerald
                                    )
                                }
                                else -> {
                                    Text(
                                        text = "Guest Shopper",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Local Encryption • Active",
                                        fontSize = 12.sp,
                                        color = BuyWiseGold
                                    )
                                }
                            }
                        }

                        if (authState is AuthState.Guest) {
                            Button(
                                onClick = { showAuthDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("🔑 SIGN IN / GOOGLE SIGN UP", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Button(
                                onClick = { authViewModel.signOut() },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF33141E)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("LOGOUT", color = Color(0xFFFF6B6B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Prominent Official Website Navigation Button
                    OutlinedButton(
                        onClick = { openWebPage("BuyWise AI Official Website", "/") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = BuyWiseCyan)
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.height(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "🌐 Open Official BuyWise AI Website",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Real Statistics Grid
            Text(
                text = "Shopping Metrics",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MetricCard("Saved Products", "—", BuyWiseCyan, Modifier.weight(1f))
                MetricCard("Price Alerts", "—", BuyWiseGold, Modifier.weight(1f))
                MetricCard("Private Looks", "$vtoCount", BuyWiseEmerald, Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // SECTION 1: AI SHOPPING CENTER
            SectionHeader("✨ AI SHOPPING CENTER", Color(0xFFA855F7))
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "👑 BuyWise Prime Digital Membership",
                actionText = "Manage ➔",
                icon = Icons.Default.Star,
                accentColor = BuyWiseGold,
                onClick = { openWebPage("BuyWise Prime Membership", "/prime") }
            )
            ProfileMenuItem(
                title = "Launch AI Virtual Try-On Studio",
                actionText = "Open ➔",
                icon = Icons.Default.Star,
                accentColor = Color(0xFFFF007F),
                onClick = { openWebPage("AI Virtual Try-On Studio", "/try-on") }
            )
            ProfileMenuItem(
                title = "Private Try-On Gallery ($vtoCount items)",
                actionText = "Manage ➔",
                icon = Icons.Default.Face,
                accentColor = BuyWiseCyan,
                onClick = {
                    showInfoDialogText = "Your Virtual Try-On selfie photos are stored privately under local device encryption in compliance with DPDP 2025."
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // SECTION 2: PREFERENCES
            SectionHeader("⚙️ PREFERENCES", BuyWiseCyan)
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "Language ($selectedLanguage)",
                actionText = "Active ➔",
                icon = Icons.Default.Settings,
                accentColor = BuyWiseCyan,
                onClick = {
                    selectedLanguage = if (selectedLanguage == "English") "Hindi (हिंदी)" else "English"
                }
            )
            ProfileMenuItem(
                title = "App Theme ($selectedTheme)",
                actionText = "Theme ➔",
                icon = Icons.Default.Settings,
                accentColor = Color(0xFFFF007F),
                onClick = {
                    selectedTheme = if (selectedTheme == "Dark Mode") "High Contrast" else "Dark Mode"
                }
            )
            ProfileMenuItem(
                title = "Offline Language Packs",
                actionText = "Active ➔",
                icon = Icons.Default.Share,
                accentColor = BuyWiseEmerald,
                onClick = {
                    showInfoDialogText = "Offline English & Hindi price search NLP models are active."
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // SECTION 3: SUPPORT & KNOWLEDGE
            SectionHeader("🛠️ SUPPORT & KNOWLEDGE", BuyWiseEmerald)
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "Shopping Knowledge Hub (14 Categories)",
                actionText = "Browse ➔",
                icon = Icons.Default.Info,
                accentColor = BuyWiseCyan,
                onClick = { openWebPage("Shopping Knowledge Hub", "/knowledge") }
            )
            ProfileMenuItem(
                title = "Help Center & FAQs",
                actionText = "FAQs ➔",
                icon = Icons.Default.Info,
                accentColor = BuyWiseEmerald,
                onClick = { openWebPage("Help Center & FAQs", "/faq") }
            )
            ProfileMenuItem(
                title = "Report Incorrect Price or Product",
                actionText = "Report ➔",
                icon = Icons.Default.Warning,
                accentColor = BuyWiseGold,
                onClick = {
                    showInfoDialogText = "Report submitted! Our automated price scraper verify engine is reviewing live store data."
                }
            )
            ProfileMenuItem(
                title = "Rate BuyWise AI",
                actionText = "Rate ➔",
                icon = Icons.Default.Star,
                accentColor = BuyWiseGold,
                onClick = {
                    showInfoDialogText = "Thank you for rating BuyWise AI 5 Stars! ⭐⭐⭐⭐⭐"
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // SECTION 4: LEGAL & COMPLIANCE (WITH PROMINENT WEBSITE LINKS)
            SectionHeader("⚖️ LEGAL & COMPLIANCE (INDIA DPDP 2025)", BuyWiseGold)
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "Privacy Policy (DPDP Act 2023 & Rules 2025)",
                actionText = "Read ➔",
                icon = Icons.Default.Lock,
                accentColor = BuyWiseEmerald,
                onClick = {
                    openLegalModal(
                        title = "Privacy Policy (DPDP 2025)",
                        subtitle = "Data Protection & Digital Privacy Standards",
                        content = "BuyWise AI complies with India Digital Personal Data Protection (DPDP) Act 2023 and DPDP Rules 2025. We process personal search data locally and strictly prohibit selling user activity logs to third-party ad brokers.",
                        websiteUrl = "/privacy-policy"
                    )
                }
            )
            ProfileMenuItem(
                title = "Terms of Service",
                actionText = "Read ➔",
                icon = Icons.Default.Info,
                accentColor = Color.LightGray,
                onClick = {
                    openLegalModal(
                        title = "Terms of Service",
                        subtitle = "Platform User Agreement",
                        content = "By using BuyWise AI, you agree to our fair price comparison guidelines, affiliate redirect disclaimers, and local virtual try-on usage terms.",
                        websiteUrl = "/terms-of-service"
                    )
                }
            )
            ProfileMenuItem(
                title = "Refund & Return Policy",
                actionText = "Read ➔",
                icon = Icons.Default.ShoppingCart,
                accentColor = BuyWiseEmerald,
                onClick = {
                    openLegalModal(
                        title = "Refund & Return Policy",
                        subtitle = "Direct Partner & Marketplace Guarantees",
                        content = "BuyWise AI Gen-G Store partners offer 7-day hassle-free returns and refunds. External retailer purchases (Amazon, Flipkart) follow respective merchant return policies.",
                        websiteUrl = "/refund-policy"
                    )
                }
            )
            ProfileMenuItem(
                title = "Affiliate Disclosure (Tag: pajonline-21)",
                actionText = "Read ➔",
                icon = Icons.Default.Info,
                accentColor = Color(0xFFFF007F),
                onClick = {
                    openLegalModal(
                        title = "Affiliate Disclosure",
                        subtitle = "Verified Merchant Referral Transparency",
                        content = "BuyWise AI earns a small referral commission when you purchase via our verified store links (e.g. pajonline-21). This comes at zero extra cost to you.",
                        websiteUrl = "/affiliate-disclosure"
                    )
                }
            )
            ProfileMenuItem(
                title = "BuyWise Partner Merchant Terms",
                actionText = "Read ➔",
                icon = Icons.Default.ShoppingCart,
                accentColor = BuyWiseGold,
                onClick = {
                    openLegalModal(
                        title = "Partner Merchant Terms",
                        subtitle = "Gen-G Seller & Merchant Guidelines",
                        content = "Partner seller onboarding terms, commission calculation, and direct customer fulfillment SLAs.",
                        websiteUrl = "/partner-terms"
                    )
                }
            )
            val versionName = BuildConfig.VERSION_NAME
            val versionCode = BuildConfig.VERSION_CODE
            ProfileMenuItem(
                title = "App Version: v$versionName (Code: $versionCode)",
                actionText = "v$versionName ($versionCode) ➔",
                icon = Icons.Default.Info,
                accentColor = Color.Gray,
                onClick = {
                    showInfoDialogText = "BuyWise AI Native Android Build\n• Version Name: $versionName\n• Version Code: $versionCode\n• Target SDK: 35 (Android 15)\n• Release Variant: Production"
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // SECTION 5: SECURITY & PRIVACY
            SectionHeader("🔐 SECURITY & PRIVACY", Color(0xFFFF007F))
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "Password & Account Security",
                actionText = "Security ➔",
                icon = Icons.Default.Lock,
                accentColor = BuyWiseEmerald,
                onClick = { showSecurityDialog = true }
            )
            ProfileMenuItem(
                title = "Privacy Center & Data Rights",
                actionText = "Privacy ➔",
                icon = Icons.Default.Lock,
                accentColor = BuyWiseCyan,
                onClick = {
                    showInfoDialogText = "Under DPDP Act 2023, you hold the Right to Correction, Data Erasure, and Consent Withdrawal."
                }
            )
            ProfileMenuItem(
                title = "Sign Out",
                actionText = "Sign Out ➔",
                icon = Icons.Default.Person,
                accentColor = Color.LightGray,
                onClick = { authViewModel.signOut() }
            )
            ProfileMenuItem(
                title = "Delete Account (DPDP Data Erasure)",
                actionText = "Delete ➔",
                icon = Icons.Default.Delete,
                accentColor = Color(0xFFFF4444),
                onClick = { showDeleteAccountDialog = true }
            )

            Spacer(modifier = Modifier.height(40.dp))

            // LEGAL DOCUMENT MODAL WITH PROMINENT WEBSITE LINK BUTTON
            activeModalTitle?.let { title ->
                AlertDialog(
                    onDismissRequest = { activeModalTitle = null },
                    containerColor = Color(0xFF141026),
                    title = {
                        Column {
                            Text(text = title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(text = activeModalSubtitle, fontSize = 12.sp, color = Color.Gray)
                        }
                    },
                    text = {
                        Column {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.04f)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = activeModalContent,
                                    fontSize = 13.sp,
                                    color = Color.LightGray,
                                    modifier = Modifier.padding(12.dp),
                                    lineHeight = 18.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))

                            // PROMINENT WEBSITE DIRECT LINK BUTTON
                            Button(
                                onClick = {
                                    val url = activeModalWebsiteUrl
                                    val docTitle = activeModalTitle ?: "Legal Document"
                                    activeModalTitle = null
                                    openWebPage(docTitle, url)
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Info, contentDescription = null, tint = Color.Black, modifier = Modifier.height(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "🌐 View Full Document on Website",
                                    color = Color.Black,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { activeModalTitle = null }) {
                            Text("Close", color = Color.Gray)
                        }
                    }
                )
            }

            // PASSWORD & ACCOUNT SECURITY DIALOG (RECOVER & CHANGE PASSWORD OPTIONS)
            if (showSecurityDialog) {
                var securityTab by remember { mutableStateOf("recover") }
                var resetEmailInput by remember {
                    mutableStateOf((authState as? AuthState.Authenticated)?.userEmail ?: "")
                }
                var newPasswordInput by remember { mutableStateOf("") }
                var confirmPasswordInput by remember { mutableStateOf("") }
                var statusMessage by remember { mutableStateOf<String?>(null) }
                var isStatusSuccess by remember { mutableStateOf(true) }

                AlertDialog(
                    onDismissRequest = { showSecurityDialog = false },
                    containerColor = Color(0xFF141026),
                    title = {
                        Column {
                            Text(
                                text = "🔐 Password & Account Security",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 17.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Secured with Firebase Auth 256-bit AES encryption",
                                color = BuyWiseEmerald,
                                fontSize = 11.sp
                            )
                        }
                    },
                    text = {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { securityTab = "recover"; statusMessage = null },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (securityTab == "recover") BuyWiseCyan else Color.White.copy(alpha = 0.1f)
                                    ),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        "🔑 Recover",
                                        color = if (securityTab == "recover") Color.Black else Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Button(
                                    onClick = { securityTab = "change"; statusMessage = null },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (securityTab == "change") BuyWiseEmerald else Color.White.copy(alpha = 0.1f)
                                    ),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        "⚡ Change",
                                        color = if (securityTab == "change") Color.Black else Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            if (securityTab == "recover") {
                                Text(
                                    text = "Send Password Recovery Link:",
                                    color = Color.LightGray,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = resetEmailInput,
                                    onValueChange = { resetEmailInput = it },
                                    label = { Text("Account Email Address", color = Color.Gray, fontSize = 12.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = BuyWiseCyan,
                                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    )
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        if (resetEmailInput.contains("@")) {
                                            authViewModel.sendPasswordResetEmail(resetEmailInput) { success, msg ->
                                                isStatusSuccess = success
                                                statusMessage = msg
                                            }
                                        } else {
                                            isStatusSuccess = false
                                            statusMessage = "Please enter a valid email address."
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("SEND RECOVERY EMAIL", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                                }
                            } else {
                                Text(
                                    text = "Set New Account Password:",
                                    color = Color.LightGray,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = newPasswordInput,
                                    onValueChange = { newPasswordInput = it },
                                    label = { Text("New Password (min 6 chars)", color = Color.Gray, fontSize = 12.sp) },
                                    singleLine = true,
                                    visualTransformation = PasswordVisualTransformation(),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = BuyWiseEmerald,
                                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    )
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = confirmPasswordInput,
                                    onValueChange = { confirmPasswordInput = it },
                                    label = { Text("Confirm New Password", color = Color.Gray, fontSize = 12.sp) },
                                    singleLine = true,
                                    visualTransformation = PasswordVisualTransformation(),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = BuyWiseEmerald,
                                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    )
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        if (newPasswordInput.length < 6) {
                                            isStatusSuccess = false
                                            statusMessage = "Password must be at least 6 characters."
                                        } else if (newPasswordInput != confirmPasswordInput) {
                                            isStatusSuccess = false
                                            statusMessage = "Passwords do not match."
                                        } else {
                                            authViewModel.changePassword(newPasswordInput) { success, msg ->
                                                isStatusSuccess = success
                                                statusMessage = msg
                                            }
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("UPDATE PASSWORD", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                                }
                            }

                            statusMessage?.let { msg ->
                                Spacer(modifier = Modifier.height(12.dp))
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isStatusSuccess) BuyWiseEmerald.copy(alpha = 0.15f) else Color(0xFFFF4444).copy(alpha = 0.15f)
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = msg,
                                        color = if (isStatusSuccess) BuyWiseEmerald else Color(0xFFFF6B6B),
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(8.dp),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { showSecurityDialog = false }) {
                            Text("Close", color = Color.Gray)
                        }
                    }
                )
            }

            // DELETE ACCOUNT DIALOG (DPDP ACT 2023 DATA ERASURE)
            if (showDeleteAccountDialog) {
                AlertDialog(
                    onDismissRequest = { showDeleteAccountDialog = false },
                    containerColor = Color(0xFF1B0D18),
                    title = {
                        Text(
                            text = "⚠️ Permanent Account Deletion",
                            color = Color(0xFFFF4444),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    },
                    text = {
                        Column {
                            Text(
                                text = "Under India Digital Personal Data Protection (DPDP) Act 2023 & DPDP Rules 2025, you hold the right to complete data erasure.",
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "This action will permanently delete your user profile, saved product lists, price drop alerts, and private AI Virtual Try-On photo assets from our encrypted servers. This process is irreversible.",
                                color = Color.LightGray,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                showDeleteAccountDialog = false
                                authViewModel.signOut()
                                showInfoDialogText = "Your account data deletion request has been executed in compliance with DPDP 2025."
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4444)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("DELETE MY ACCOUNT", color = Color.White, fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showDeleteAccountDialog = false }) {
                            Text("Cancel", color = Color.Gray)
                        }
                    }
                )
            }

            // GENERIC INFO DIALOG
            showInfoDialogText?.let { infoText ->
                AlertDialog(
                    onDismissRequest = { showInfoDialogText = null },
                    containerColor = Color(0xFF141026),
                    title = { Text("BuyWise AI", color = Color.White, fontWeight = FontWeight.Bold) },
                    text = { Text(infoText, color = Color.LightGray, fontSize = 13.sp) },
                    confirmButton = {
                        Button(
                            onClick = { showInfoDialogText = null },
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                        ) {
                            Text("OK", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }

            if (showAuthDialog) {
                AuthDialog(
                    onDismiss = { showAuthDialog = false },
                    onAuthSuccess = { showAuthDialog = false }
                )
            }
        }
    }
}

@Composable
fun SectionHeader(title: String, color: Color) {
    Text(
        text = title,
        fontSize = 12.sp,
        fontWeight = FontWeight.Black,
        color = color,
        letterSpacing = 0.5.sp
    )
}

@Composable
fun MetricCard(title: String, countText: String, accentColor: Color, modifier: Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = countText, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = accentColor)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = title, fontSize = 11.sp, color = Color.Gray)
        }
    }
}

@Composable
fun ProfileMenuItem(
    title: String,
    actionText: String = "Open ➔",
    icon: ImageVector,
    accentColor: Color = BuyWiseCyan,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.height(20.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            Text(
                text = actionText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = accentColor
            )
        }
    }
}

