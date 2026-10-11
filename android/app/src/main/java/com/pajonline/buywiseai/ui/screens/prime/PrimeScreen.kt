package com.pajonline.buywiseai.ui.screens.prime

import androidx.compose.runtime.Composable

@Composable
fun PrimeScreen(
    onNavigateToWeb: (title: String, url: String) -> Unit = { _, _ -> }
) {
    PrimeMembershipScreen()
}

