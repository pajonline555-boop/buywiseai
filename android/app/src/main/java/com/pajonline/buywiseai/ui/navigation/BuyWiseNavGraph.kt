package com.pajonline.buywiseai.ui.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.pajonline.buywiseai.ui.screens.alerts.AlertsScreen
import com.pajonline.buywiseai.ui.screens.checkout.CheckoutScreen
import com.pajonline.buywiseai.ui.screens.competition.CompetitionScreen
import com.pajonline.buywiseai.ui.screens.details.ProductDetailsScreen
import com.pajonline.buywiseai.ui.screens.home.HomeScreen
import com.pajonline.buywiseai.ui.screens.profile.ProfileScreen
import com.pajonline.buywiseai.ui.screens.search.SearchScreen
import com.pajonline.buywiseai.ui.screens.vto.VtoScreen
import com.pajonline.buywiseai.ui.viewmodel.AuthViewModel
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareViewModel

@Composable
fun BuyWiseNavGraph(
    navController: NavHostController,
    paddingValues: PaddingValues,
    compareViewModel: SmartCompareViewModel = remember { SmartCompareViewModel() },
    authViewModel: AuthViewModel = remember { AuthViewModel() },
    onOpenAiAssistant: () -> Unit = {}
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = Modifier.padding(paddingValues)
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToSearch = { query ->
                    compareViewModel.performSearch(query)
                    navController.navigate(Screen.Search.route)
                },
                onNavigateToVto = { navController.navigate(Screen.Vto.route) },
                onNavigateToCompetition = { navController.navigate(Screen.Competition.route) },
                onNavigateToAlerts = { navController.navigate(Screen.Alerts.route) },
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                onNavigateToAdmin = { navController.navigate(Screen.Admin.route) },
                onOpenAiAssistant = onOpenAiAssistant
            )
        }
        composable(Screen.Search.route) {
            val context = androidx.compose.ui.platform.LocalContext.current
            SearchScreen(
                viewModel = compareViewModel,
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.findStartDestination().id) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                },
                onOfferSelect = { offer ->
                    try {
                        val targetUrl = if (offer.url.startsWith("http")) {
                            offer.url
                        } else {
                            com.pajonline.buywiseai.data.repository.SmartMarketIntelligence.buildDirectStoreUrl(offer.store, offer.title)
                        }
                        val browserIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(targetUrl)).apply {
                            addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(browserIntent)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            )
        }
        composable(Screen.Competition.route) {
            CompetitionScreen(
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.findStartDestination().id) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                },
                onNavigateToVto = { navController.navigate(Screen.Vto.route) },
                onNavigateToWeb = { title, url ->
                    try {
                        val encodedTitle = java.net.URLEncoder.encode(title, "UTF-8")
                        val encodedUrl = java.net.URLEncoder.encode(url, "UTF-8")
                        navController.navigate("web_viewer/$encodedTitle/$encodedUrl")
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            )
        }
        composable("details") {
            ProductDetailsScreen(
                offer = compareViewModel.selectedOffer,
                onBack = { navController.popBackStack() },
                onNavigateToVto = { navController.navigate(Screen.Vto.route) },
                onNavigateToCheckout = { navController.navigate("checkout") }
            )
        }
        composable("checkout") {
            CheckoutScreen(
                offer = compareViewModel.selectedOffer,
                onBack = { navController.popBackStack() },
                onOrderComplete = { navController.navigate(Screen.Home.route) }
            )
        }
        composable(Screen.Vto.route) {
            VtoScreen(
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.findStartDestination().id) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                }
            )
        }
        composable(Screen.Prime.route) {
            com.pajonline.buywiseai.ui.screens.prime.PrimeMembershipScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(Screen.Alerts.route) {
            AlertsScreen(
                onNavigateToChallenge = { navController.navigate(Screen.Competition.route) }
            )
        }
        composable(Screen.Admin.route) {
            com.pajonline.buywiseai.ui.screens.admin.AdminDashboardScreen(
                onBack = { navController.popBackStack() },
                onNavigateToWeb = { title, url ->
                    try {
                        val encodedTitle = java.net.URLEncoder.encode(title, "UTF-8")
                        val encodedUrl = java.net.URLEncoder.encode(url, "UTF-8")
                        navController.navigate("web_viewer/$encodedTitle/$encodedUrl")
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            )
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
                authViewModel = authViewModel,
                onNavigateToPrime = { navController.navigate(Screen.Prime.route) },
                onNavigateToAdmin = { navController.navigate(Screen.Admin.route) },
                onNavigateToWeb = { title, url ->
                    try {
                        val encodedTitle = java.net.URLEncoder.encode(title, "UTF-8")
                        val encodedUrl = java.net.URLEncoder.encode(url, "UTF-8")
                        navController.navigate("web_viewer/$encodedTitle/$encodedUrl")
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            )
        }
        composable("web_viewer/{title}/{url}") { backStackEntry ->
            val title = try {
                java.net.URLDecoder.decode(backStackEntry.arguments?.getString("title") ?: "BuyWise AI", "UTF-8")
            } catch (e: Exception) { "BuyWise AI" }
            val url = try {
                java.net.URLDecoder.decode(backStackEntry.arguments?.getString("url") ?: "https://buywiseai.pajonline.co.in", "UTF-8")
            } catch (e: Exception) { "https://buywiseai.pajonline.co.in" }
            
            com.pajonline.buywiseai.ui.screens.web.WebViewerScreen(
                title = title,
                initialUrl = url,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
