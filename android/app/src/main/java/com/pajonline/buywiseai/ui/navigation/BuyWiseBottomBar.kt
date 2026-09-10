package com.pajonline.buywiseai.ui.navigation

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan

@Composable
fun BuyWiseBottomBar(navController: NavController) {
    val items = Screen.bottomNavItems
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
            val labelText = tr(screen.titleKey)
            NavigationBarItem(
                icon = { Icon(screen.icon, contentDescription = labelText) },
                label = { Text(labelText) },
                selected = isSelected,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BuyWiseCyan,
                    selectedTextColor = BuyWiseCyan,
                    indicatorColor = Color(0xFF1E1B2E),
                    unselectedIconColor = Color.Gray,
                    unselectedTextColor = Color.Gray
                ),
                onClick = {
                    if (currentRoute != screen.route) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.startDestinationId) {
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
