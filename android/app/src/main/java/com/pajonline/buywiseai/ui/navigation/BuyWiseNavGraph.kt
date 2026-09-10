package com.pajonline.buywiseai.ui.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
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
import com.pajonline.buywiseai.ui.viewmodel.SmartCompareViewModel

@Composable
fun BuyWiseNavGraph(
    navController: NavHostController,
    paddingValues: PaddingValues,
    compareViewModel: SmartCompareViewModel = remember { SmartCompareViewModel() },
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
                onOpenAiAssistant = onOpenAiAssistant
            )
        }
        composable(Screen.Search.route) {
            SearchScreen(
                viewModel = compareViewModel,
                onOfferSelect = { offer ->
                    navController.navigate("details")
                }
            )
        }
        composable(Screen.Competition.route) {
            CompetitionScreen(
                onNavigateToVto = { navController.navigate(Screen.Vto.route) }
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
            VtoScreen()
        }
        composable(Screen.Alerts.route) {
            AlertsScreen()
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
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
