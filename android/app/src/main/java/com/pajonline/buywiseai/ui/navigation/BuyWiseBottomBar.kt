package com.pajonline.buywiseai.ui.navigation

import android.content.Context
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import coil.compose.AsyncImage
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan

@Composable
fun BuyWiseBottomBar(navController: NavController) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("buywise_profile_prefs", Context.MODE_PRIVATE) }
    val profilePhotoUri = sharedPrefs.getString("profile_photo_uri", null)
    val profileAvatarEmoji = sharedPrefs.getString("profile_avatar_emoji", "🛍️")

    val authRepo = remember { com.pajonline.buywiseai.data.repository.AuthRepository.getInstance() }
    val authState by authRepo.authState.collectAsState()
    val savedEmail = sharedPrefs.getString("saved_user_email", "") ?: ""
    val isAdmin = (authState as? com.pajonline.buywiseai.data.repository.AuthState.Authenticated)?.let {
        it.role == "ADMIN" || authRepo.isEmailAdmin(it.userEmail)
    } ?: authRepo.isEmailAdmin(savedEmail)

    val items = Screen.getNavItems(isAdmin)
    val navBackStackEntry = navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry.value?.destination?.route

    if (currentRoute == null || currentRoute.startsWith("web_viewer") || currentRoute.startsWith("details")) {
        return
    }

    NavigationBar(
        containerColor = Color(0xFF0C0A14),
        contentColor = Color.White
    ) {
        items.forEach { screen ->
            val isSelected = currentRoute == screen.route
            val labelText = if (screen == Screen.Admin) "Admin" else tr(screen.titleKey)
            NavigationBarItem(
                icon = {
                    if (screen == Screen.Admin) {
                        Text(
                            text = "👑",
                            fontSize = 17.sp
                        )
                    } else if (screen == Screen.Profile) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) BuyWiseCyan else Color.Gray,
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!profilePhotoUri.isNullOrEmpty()) {
                                AsyncImage(
                                    model = profilePhotoUri,
                                    contentDescription = labelText,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else if (!profileAvatarEmoji.isNullOrEmpty()) {
                                Text(profileAvatarEmoji, fontSize = 12.sp)
                            } else {
                                Icon(
                                    imageVector = screen.icon,
                                    contentDescription = labelText,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    } else {
                        Icon(screen.icon, contentDescription = labelText)
                    }
                },
                label = {
                    Text(
                        text = labelText,
                        maxLines = 1,
                        softWrap = false,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                        fontSize = 11.sp
                    )
                },
                selected = isSelected,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BuyWiseCyan,
                    selectedTextColor = BuyWiseCyan,
                    indicatorColor = Color(0xFF1E1B2E),
                    unselectedIconColor = Color.Gray,
                    unselectedTextColor = Color.Gray
                ),
                onClick = {
                    if (screen.route == Screen.Home.route) {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                inclusive = false
                            }
                            launchSingleTop = true
                        }
                    } else if (currentRoute != screen.route) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        }
    }
}
