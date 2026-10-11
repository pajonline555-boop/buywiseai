package com.pajonline.buywiseai.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = BuyWiseCyan,
    secondary = BuyWiseNeonPink,
    tertiary = BuyWiseEmerald,
    background = BuyWiseDarkBackground,
    surface = BuyWiseDarkBackground,
    onBackground = androidx.compose.ui.graphics.Color.White,
    onSurface = androidx.compose.ui.graphics.Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = BuyWisePurple,
    secondary = BuyWiseNeonPink,
    tertiary = BuyWiseCyan,
    background = androidx.compose.ui.graphics.Color(0xFFF8FAFC),
    surface = androidx.compose.ui.graphics.Color.White,
    onBackground = androidx.compose.ui.graphics.Color(0xFF0F172A),
    onSurface = androidx.compose.ui.graphics.Color(0xFF0F172A)
)

private val HighContrastColorScheme = darkColorScheme(
    primary = androidx.compose.ui.graphics.Color(0xFF00FFFF),
    secondary = androidx.compose.ui.graphics.Color(0xFFFF00FF),
    tertiary = androidx.compose.ui.graphics.Color(0xFF00FF00),
    background = androidx.compose.ui.graphics.Color.Black,
    surface = androidx.compose.ui.graphics.Color(0xFF121212),
    onBackground = androidx.compose.ui.graphics.Color.White,
    onSurface = androidx.compose.ui.graphics.Color.White
)

@Composable
fun BuyWiseTheme(
    appTheme: String = "Dark Mode",
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when (appTheme) {
        "Light Mode" -> LightColorScheme
        "High Contrast" -> HighContrastColorScheme
        "Dark Mode" -> DarkColorScheme
        else -> if (darkTheme) DarkColorScheme else LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
