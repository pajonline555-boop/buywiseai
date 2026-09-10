package com.pajonline.buywiseai.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val titleKey: String, val icon: ImageVector) {
    object Home : Screen("home", "nav_home", Icons.Default.Home)
    object Search : Screen("search", "nav_search", Icons.Default.Search)
    object Competition : Screen("competition", "nav_comp", Icons.Default.Star)
    object Vto : Screen("vto", "nav_vto", Icons.Default.Face)
    object Alerts : Screen("alerts", "Alerts", Icons.Default.Notifications)
    object Profile : Screen("profile", "nav_profile", Icons.Default.Person)

    companion object {
        val bottomNavItems = listOf(Home, Search, Competition, Vto, Profile)
    }
}
