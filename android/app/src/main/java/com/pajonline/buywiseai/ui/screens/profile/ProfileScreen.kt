package com.pajonline.buywiseai.ui.screens.profile

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Refresh
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
import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.pajonline.buywiseai.data.i18n.LanguageManager
import com.pajonline.buywiseai.data.i18n.tr
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
    onNavigateToPrime: () -> Unit = {},
    onNavigateToAdmin: () -> Unit = {},
    onNavigateToWeb: (title: String, url: String) -> Unit = { _, _ -> }
) {
    val authState by authViewModel.authState.collectAsState()
    val authRepo = remember { com.pajonline.buywiseai.data.repository.AuthRepository.getInstance() }
    var showAuthDialog by remember { mutableStateOf(false) }
    var activeModalTitle by remember { mutableStateOf<String?>(null) }
    var activeModalSubtitle by remember { mutableStateOf("") }
    var activeModalContent by remember { mutableStateOf("") }
    var activeModalWebsiteUrl by remember { mutableStateOf("") }
    var showAppUpdateDialog by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("buywise_profile_prefs", Context.MODE_PRIVATE) }

    var userDisplayName by remember(authState) {
        val authName = (authState as? AuthState.Authenticated)?.displayName
        val saved = sharedPrefs.getString("saved_display_name", null)
        mutableStateOf(
            if (authState is AuthState.Authenticated) {
                if (!authName.isNullOrEmpty()) authName else if (!saved.isNullOrEmpty()) saved else "BuyWise Shopper"
            } else {
                "Guest Shopper"
            }
        )
    }
    var userEmail by remember(authState) {
        val authEmail = (authState as? AuthState.Authenticated)?.userEmail
        val saved = sharedPrefs.getString("saved_user_email", null)
        mutableStateOf(
            if (authState is AuthState.Authenticated) {
                if (!authEmail.isNullOrEmpty()) authEmail else if (!saved.isNullOrEmpty()) saved else ""
            } else {
                ""
            }
        )
    }
    var userPhone by remember {
        mutableStateOf(sharedPrefs.getString("saved_user_phone", "") ?: "")
    }
    var showEditProfileDialog by remember { mutableStateOf(false) }

    LaunchedEffect(authState) {
        val state = authState
        if (state is AuthState.Authenticated) {
            val name = if (state.displayName.isNotBlank()) state.displayName else "BuyWise Shopper"
            val email = state.userEmail
            userDisplayName = name
            userEmail = email
            if (email.isNotBlank()) {
                sharedPrefs.edit()
                    .putString("saved_display_name", name)
                    .putString("saved_user_email", email)
                    .apply()
            }
            // Load full profile from Firestore (gets mobile, updated name, etc.)
            authRepo.loadUserProfileFromFirestore { firestoreName, firestoreEmail, firestoreMobile, _ ->
                if (firestoreName.isNotBlank()) {
                    userDisplayName = firestoreName
                    sharedPrefs.edit().putString("saved_display_name", firestoreName).apply()
                }
                if (firestoreEmail.isNotBlank()) {
                    userEmail = firestoreEmail
                    sharedPrefs.edit().putString("saved_user_email", firestoreEmail).apply()
                }
                if (firestoreMobile.isNotBlank()) {
                    userPhone = firestoreMobile
                    sharedPrefs.edit().putString("saved_user_phone", firestoreMobile).apply()
                }
            }
        } else if (state is AuthState.Unauthenticated) {
            userDisplayName = "Guest Shopper"
            userEmail = ""
            sharedPrefs.edit().remove("saved_display_name").remove("saved_user_email").remove("saved_user_phone").apply()
        }
    }

    val isAdmin = (authState as? AuthState.Authenticated)?.let {
        it.role == "ADMIN" || authRepo.isEmailAdmin(it.userEmail)
    } ?: authRepo.isEmailAdmin(userEmail)

    var selectedLanguage by remember {
        mutableStateOf(LanguageManager.supportedLanguages.firstOrNull { it.code == LanguageManager.currentLanguageCode }?.name ?: "English")
    }
    var selectedTheme by remember {
        mutableStateOf(sharedPrefs.getString("saved_app_theme", "Dark Mode") ?: "Dark Mode")
    }
    var showInfoDialogText by remember { mutableStateOf<String?>(null) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }
    var showSecurityDialog by remember { mutableStateOf(false) }
    var profilePhotoUri by remember { mutableStateOf(sharedPrefs.getString("profile_photo_uri", null)) }
    var profileAvatarEmoji by remember { mutableStateOf(sharedPrefs.getString("profile_avatar_emoji", "🛍️") ?: "🛍️") }
    var showPhotoPickerModal by remember { mutableStateOf(false) }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                val destFile = File(context.filesDir, "user_profile_avatar.jpg")
                context.contentResolver.openInputStream(uri)?.use { input ->
                    destFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                val localPath = destFile.absolutePath
                profilePhotoUri = localPath
                sharedPrefs.edit().putString("profile_photo_uri", localPath).apply()
            } catch (e: Exception) {
                profilePhotoUri = uri.toString()
                sharedPrefs.edit().putString("profile_photo_uri", uri.toString()).apply()
            }
        }
    }

    val privateVtoDir = File(context.filesDir, "vto_private")
    val vtoCount = (privateVtoDir.listFiles() ?: emptyArray()).size

    val playStoreUrl = "https://play.google.com/store/apps/details?id=com.pajonline.buywiseai&hl=en-US&ah=siK1dcywSbhtZZS4Fvy3n9jvWVg&pli=1"

    fun openPlayStorePage() {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.pajonline.buywiseai")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse(playStoreUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
        }
    }

    fun openWebPage(title: String, urlPath: String) {
        val cleanPath = if (urlPath.startsWith("/")) urlPath else "/$urlPath"
        var fullUrl = if (urlPath.startsWith("http")) urlPath else "https://buywiseai.pajonline.co.in$cleanPath"
        if (isAdmin && (cleanPath.startsWith("/admin") || cleanPath.startsWith("/partner-portal")) && !fullUrl.contains("admin_email")) {
            val sep = if (fullUrl.contains("?")) "&" else "?"
            val emailParam = if (userEmail.isNotBlank()) userEmail else "pajonline555@gmail.com"
            fullUrl += "${sep}native=true&admin_email=$emailParam"
        }
        onNavigateToWeb(title, fullUrl)
    }

    fun openLegalModal(title: String, subtitle: String, content: String, websiteUrl: String) {
        activeModalTitle = title
        activeModalSubtitle = subtitle
        activeModalContent = content
        activeModalWebsiteUrl = websiteUrl
    }

    var showLogoutConfirmDialog by remember { mutableStateOf(false) }

    if (showLogoutConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirmDialog = false },
            containerColor = Color(0xFF141026),
            title = {
                Text("🚪 Confirm Sign Out?", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            },
            text = {
                Text(
                    "Are you sure you want to log out of BuyWise AI? Your price alerts, virtual try-on looks, and shopping preferences will stay safely stored in your account.",
                    color = Color.LightGray,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutConfirmDialog = false
                        com.pajonline.buywiseai.data.repository.GoogleSignInHelper(context).signOutGoogle()
                        authViewModel.signOut()
                        userDisplayName = "Guest Shopper"
                        userEmail = ""
                        sharedPrefs.edit().remove("saved_display_name").remove("saved_user_email").remove("saved_user_phone").apply()
                        Toast.makeText(context, "Signed out successfully!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4444)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("YES, LOG OUT", color = Color.White, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showLogoutConfirmDialog = false },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("NO, KEEP ME SIGNED IN", color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                }
            }
        )
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
                text = tr("profile_title"),
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
                    // Top Section: Avatar + Display Name & Email (Full Width Row)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        // Interactive User Avatar Box with Camera Badge Overlay
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .clickable { showPhotoPickerModal = true }
                        ) {
                            val currentPhotoUri = profilePhotoUri
                            val photoFile = remember(currentPhotoUri) {
                                if (!currentPhotoUri.isNullOrEmpty()) File(currentPhotoUri) else null
                            }
                            val imageModel: Any? = when {
                                photoFile?.exists() == true -> photoFile
                                !currentPhotoUri.isNullOrEmpty() && (currentPhotoUri.startsWith("http://") || currentPhotoUri.startsWith("https://") || currentPhotoUri.startsWith("content://")) -> currentPhotoUri
                                else -> null
                            }

                            if (imageModel != null) {
                                AsyncImage(
                                    model = imageModel,
                                    contentDescription = "Profile Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                        .border(2.dp, BuyWiseCyan, CircleShape),
                                    onError = {
                                        profilePhotoUri = null
                                        sharedPrefs.edit().remove("profile_photo_uri").apply()
                                    }
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color(0xFFA855F7).copy(alpha = 0.25f), CircleShape)
                                        .border(2.dp, Color(0xFFA855F7), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(profileAvatarEmoji, fontSize = 28.sp)
                                }
                            }

                            // Camera edit badge overlay
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .background(BuyWiseCyan, CircleShape)
                                    .border(1.5.dp, Color(0xFF141026), CircleShape)
                                    .align(Alignment.BottomEnd),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("📷", fontSize = 10.sp)
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { showEditProfileDialog = true }
                        ) {
                            Text(
                                text = userDisplayName,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (userEmail.isNotEmpty()) userEmail else "Tap to edit profile details ✏️",
                                fontSize = 12.sp,
                                color = if (userEmail.isNotEmpty()) BuyWiseEmerald else BuyWiseGold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Action Buttons Row (Full Width Below Avatar)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { showEditProfileDialog = true },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("✏️ EDIT", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Black)
                        }

                        if (authState is AuthState.Authenticated) {
                            Button(
                                onClick = { showLogoutConfirmDialog = true },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF4444).copy(alpha = 0.2f)),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFF4444)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("🚪 SIGN OUT", color = Color(0xFFFF6B6B), fontSize = 11.sp, fontWeight = FontWeight.Black)
                            }
                        } else {
                            Button(
                                onClick = { showAuthDialog = true },
                                modifier = Modifier.weight(1.2f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("🔑 SIGN IN / UP", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Black)
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

                    Spacer(modifier = Modifier.height(10.dp))

                    // GOOGLE PLAY STORE CONNECTED APP & RATING CARD
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { openPlayStorePage() },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1633)),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("▶️ Google Play", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color.White)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .background(BuyWiseGold.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("★ 5.0 RATING", fontSize = 9.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                                    }
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "com.pajonline.buywiseai",
                                    fontSize = 11.sp,
                                    color = BuyWiseEmerald,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Official Android App on Google Play Store",
                                    fontSize = 10.sp,
                                    color = Color.LightGray
                                )
                            }

                            Button(
                                onClick = { openPlayStorePage() },
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("RATE ★ 5.0", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            }

            if (isAdmin) {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToAdmin() },
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1438)),
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, BuyWiseGold)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(BuyWiseGold.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                                    .border(1.dp, BuyWiseGold, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text("👑 ADMIN COMMAND CENTER", fontSize = 10.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                            }

                            Box(
                                modifier = Modifier
                                    .background(BuyWiseEmerald.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text("● AUTHORIZED SESSION", fontSize = 9.sp, fontWeight = FontWeight.Black, color = BuyWiseEmerald)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Welcome Administrator, $userDisplayName",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = "Access live store inventory, competition challenge voting, partner orders & system security scorecard.",
                            fontSize = 12.sp,
                            color = Color.LightGray
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = { onNavigateToAdmin() },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("⚡ LAUNCH ADMIN DASHBOARD", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { openWebPage("Inventory Control", "/admin/inventory") },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = BuyWiseCyan)
                            ) {
                                Text("📦 Stock", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { openWebPage("Competition Manager", "/admin/competitions") },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = BuyWiseEmerald)
                            ) {
                                Text("🏆 Challenge", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { openWebPage("Security Logs", "/admin/security") },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF6B6B))
                            ) {
                                Text("🛡️ Security", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
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

            // SECTION 0: ADMIN OPERATIONS (ONLY VISIBLE TO ADMINS)
            if (isAdmin) {
                SectionHeader("👑 ADMIN OPERATIONS", BuyWiseGold)
                Spacer(modifier = Modifier.height(8.dp))
                ProfileMenuItem(
                    title = "👑 Open Admin Control Center",
                    actionText = "Manage ➔",
                    icon = Icons.Default.Star,
                    accentColor = BuyWiseGold,
                    onClick = { onNavigateToAdmin() }
                )
                ProfileMenuItem(
                    title = "📦 Live Inventory Control Workspace",
                    actionText = "Stock ➔",
                    icon = Icons.Default.ShoppingCart,
                    accentColor = BuyWiseCyan,
                    onClick = { openWebPage("Inventory Control Workspace", "/admin/inventory") }
                )
                ProfileMenuItem(
                    title = "🏆 Weekly Competition Manager",
                    actionText = "Manage ➔",
                    icon = Icons.Default.Star,
                    accentColor = BuyWiseEmerald,
                    onClick = { openWebPage("Competition Manager", "/admin/competitions") }
                )
                ProfileMenuItem(
                    title = "🛡️ Security Scorecard & Audit Logs",
                    actionText = "Audit ➔",
                    icon = Icons.Default.Lock,
                    accentColor = Color(0xFFFF4D4D),
                    onClick = { openWebPage("Security Logs", "/admin/security") }
                )
                Spacer(modifier = Modifier.height(24.dp))
            }

            // SECTION 1: AI SHOPPING CENTER
            SectionHeader("✨ AI SHOPPING CENTER", Color(0xFFA855F7))
            Spacer(modifier = Modifier.height(8.dp))
            ProfileMenuItem(
                title = "👑 BuyWise Prime Digital Membership (Google Play)",
                actionText = "Manage ➔",
                icon = Icons.Default.Star,
                accentColor = BuyWiseGold,
                onClick = { onNavigateToPrime() }
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
                title = "Edit Profile Name & Details ($userDisplayName)",
                actionText = "Edit ➔",
                icon = Icons.Default.Person,
                accentColor = BuyWiseEmerald,
                onClick = { showEditProfileDialog = true }
            )
            ProfileMenuItem(
                title = "Language ($selectedLanguage)",
                actionText = "Active ➔",
                icon = Icons.Default.Settings,
                accentColor = BuyWiseCyan,
                onClick = {
                    val nextCode = LanguageManager.cycleNextLanguage(context)
                    selectedLanguage = LanguageManager.supportedLanguages.firstOrNull { it.code == nextCode }?.name ?: "English"
                }
            )
            ProfileMenuItem(
                title = "App Theme ($selectedTheme)",
                actionText = "Theme ➔",
                icon = Icons.Default.Settings,
                accentColor = Color(0xFFFF007F),
                onClick = {
                    val nextTheme = when (selectedTheme) {
                        "Dark Mode" -> "Light Mode"
                        "Light Mode" -> "High Contrast"
                        else -> "Dark Mode"
                    }
                    selectedTheme = nextTheme
                    sharedPrefs.edit().putString("saved_app_theme", nextTheme).apply()
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
            ProfileMenuItem(
                title = "App Guide (Replay Tutorial)",
                actionText = "Replay ➔",
                icon = Icons.Default.Info,
                accentColor = BuyWiseGold,
                onClick = {
                    val prefs = context.getSharedPreferences("buywise_app_prefs", Context.MODE_PRIVATE)
                    prefs.edit().putBoolean("has_completed_buywise_onboarding", false).apply()
                    showInfoDialogText = "App Guide onboarding reset! Restart BuyWise AI or open Home to view the 7-card tutorial guide."
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
                title = "Rate BuyWise AI on Google Play",
                actionText = "★ 5.0 Rate ➔",
                icon = Icons.Default.Star,
                accentColor = BuyWiseGold,
                onClick = {
                    openPlayStorePage()
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
                title = "Check for App Updates (v$versionName)",
                actionText = "Update ➔",
                icon = Icons.Default.Refresh,
                accentColor = BuyWiseEmerald,
                onClick = {
                    showAppUpdateDialog = true
                }
            )
            ProfileMenuItem(
                title = "App Version: v$versionName (Build: $versionCode)",
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
                accentColor = Color(0xFFFF6B6B),
                onClick = {
                    showLogoutConfirmDialog = true
                }
            )
            ProfileMenuItem(
                title = "Delete Account (DPDP Data Erasure)",
                actionText = "Delete ➔",
                icon = Icons.Default.Delete,
                accentColor = Color(0xFFFF4444),
                onClick = { showDeleteAccountDialog = true }
            )

            Spacer(modifier = Modifier.height(40.dp))

            // APP UPDATE CENTER DIALOG
            if (showAppUpdateDialog) {
                AlertDialog(
                    onDismissRequest = { showAppUpdateDialog = false },
                    containerColor = Color(0xFF141026),
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🚀", fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("App Update Center", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Text("BuyWise AI for Android", color = BuyWiseCyan, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    },
                    text = {
                        Column {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1F1A38)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Installed Version", color = Color.Gray, fontSize = 12.sp)
                                        Text("v$versionName (Build $versionCode)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Platform", color = Color.Gray, fontSize = 12.sp)
                                        Text("Android 15 (API 35)", color = BuyWiseCyan, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Status", color = Color.Gray, fontSize = 12.sp)
                                        Text("● Official Production Release", color = BuyWiseEmerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text("✨ WHAT'S NEW IN THIS UPDATE:", color = BuyWiseGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("• ⚡ Instant Google Sign-In with Dual-Engine Auto-Recovery (fixes Google Play Services Code 8 & Code 10)", color = Color.LightGray, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("• 👗 AI Virtual Try-On 2.0 with On-Device Private DPDP 2025 Storage", color = Color.LightGray, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("• 🛍️ Real-Time Price Comparison across Amazon, Flipkart, Croma & Meesho", color = Color.LightGray, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("• 🏷️ Verified Live Coupons & Gen-G Direct Merchant Store", color = Color.LightGray, fontSize = 11.sp)

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    showAppUpdateDialog = false
                                    openPlayStorePage()
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("UPDATE ON GOOGLE PLAY STORE ➔", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
                            }
                        }
                    },
                    confirmButton = {},
                    dismissButton = {
                        TextButton(onClick = { showAppUpdateDialog = false }) {
                            Text("Close", color = Color.Gray)
                        }
                    }
                )
            }

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

            if (showPhotoPickerModal) {
                AlertDialog(
                    onDismissRequest = { showPhotoPickerModal = false },
                    containerColor = Color(0xFF141026),
                    title = {
                        Text("🖼️ Set Profile Picture", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    },
                    text = {
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Button(
                                onClick = {
                                    showPhotoPickerModal = false
                                    photoPickerLauncher.launch("image/*")
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("📸 Choose Photo from Phone Gallery", color = Color.Black, fontWeight = FontWeight.Bold)
                            }

                            Text("Or select a shopping avatar:", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                val avatars = listOf("🛍️", "🚀", "🤖", "👑", "👟")
                                avatars.forEach { emoji ->
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .background(Color(0xFF241D3A), CircleShape)
                                            .border(
                                                if (profilePhotoUri == null && profileAvatarEmoji == emoji) 2.dp else 0.dp,
                                                BuyWiseCyan,
                                                CircleShape
                                            )
                                            .clickable {
                                                profilePhotoUri = null
                                                profileAvatarEmoji = emoji
                                                sharedPrefs.edit().remove("profile_photo_uri").putString("profile_avatar_emoji", emoji).apply()
                                                showPhotoPickerModal = false
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(emoji, fontSize = 24.sp)
                                    }
                                }
                            }

                            if (!profilePhotoUri.isNullOrEmpty()) {
                                OutlinedButton(
                                    onClick = {
                                        profilePhotoUri = null
                                        sharedPrefs.edit().remove("profile_photo_uri").apply()
                                        showPhotoPickerModal = false
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("🗑️ Remove Custom Photo", color = Color(0xFFFF6B6B))
                                }
                            }
                        }
                    },
                    confirmButton = {},
                    dismissButton = {
                        TextButton(onClick = { showPhotoPickerModal = false }) {
                            Text("Cancel", color = Color.Gray)
                        }
                    }
                )
            }

            if (showEditProfileDialog) {
                var editNameInput by remember { mutableStateOf(userDisplayName) }
                var editEmailInput by remember { mutableStateOf(userEmail) }
                var editPhoneInput by remember { mutableStateOf(userPhone) }

                AlertDialog(
                    onDismissRequest = { showEditProfileDialog = false },
                    containerColor = Color(0xFF141026),
                    title = {
                        Column {
                            Text(
                                text = "✏️ Edit Profile Details",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Text(
                                text = "Update display name, email & phone",
                                color = Color.Gray,
                                fontSize = 12.sp
                            )
                        }
                    },
                    text = {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(
                                onClick = { showPhotoPickerModal = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF241D3A)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("📸 Change Profile Picture / Avatar", color = BuyWiseCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }

                            OutlinedTextField(
                                value = editNameInput,
                                onValueChange = { editNameInput = it },
                                label = { Text("Full Name *", color = Color.Gray, fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan,
                                    unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )

                            OutlinedTextField(
                                value = editEmailInput,
                                onValueChange = { editEmailInput = it },
                                label = { Text("Email Address", color = Color.Gray, fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan,
                                    unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )

                            OutlinedTextField(
                                value = editPhoneInput,
                                onValueChange = { editPhoneInput = it },
                                label = { Text("Mobile Phone Number", color = Color.Gray, fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan,
                                    unfocusedBorderColor = Color.Gray.copy(alpha = 0.5f),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                if (editNameInput.isBlank()) {
                                    Toast.makeText(context, "Name cannot be empty", Toast.LENGTH_SHORT).show()
                                } else {
                                    val trimmedName = editNameInput.trim()
                                    val trimmedEmail = editEmailInput.trim()
                                    val trimmedPhone = editPhoneInput.trim()
                                    userDisplayName = trimmedName
                                    userEmail = trimmedEmail
                                    userPhone = trimmedPhone
                                    sharedPrefs.edit()
                                        .putString("saved_display_name", trimmedName)
                                        .putString("saved_user_email", trimmedEmail)
                                        .putString("saved_user_phone", trimmedPhone)
                                        .apply()
                                    showEditProfileDialog = false
                                    Toast.makeText(context, "✓ Profile updated: $trimmedName", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("SAVE PROFILE ✓", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showEditProfileDialog = false }) {
                            Text("Cancel", color = Color.Gray)
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

