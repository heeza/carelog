package com.carelog.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private val LightColors = lightColorScheme(
    primary = CareLogColors.Accent,
    onPrimary = CareLogColors.Surface,
    secondary = CareLogColors.AccentDeep,
    background = CareLogColors.Bg,
    onBackground = CareLogColors.Ink,
    surface = CareLogColors.Surface,
    onSurface = CareLogColors.Ink,
    error = CareLogColors.Danger,
    onError = CareLogColors.Surface,
    outline = CareLogColors.Border,
)

private val DarkColors = darkColorScheme(
    primary = CareLogColors.Accent,
    secondary = CareLogColors.AccentDeep,
    background = CareLogColors.Ink,
    onBackground = CareLogColors.Surface,
    surface = CareLogColors.Ink,
    onSurface = CareLogColors.Surface,
    error = CareLogColors.Danger
)

private val HighContrastColors = lightColorScheme(
    primary = CareLogColors.Ink,
    onPrimary = CareLogColors.Surface,
    secondary = CareLogColors.AccentDeep,
    onSecondary = CareLogColors.Surface,
    background = CareLogColors.Surface,
    onBackground = CareLogColors.Ink,
    surface = CareLogColors.Surface,
    onSurface = CareLogColors.Ink,
    error = CareLogColors.Danger,
    onError = CareLogColors.Surface,
    outline = CareLogColors.Ink
)

data class CareLogDimensions(
    val minTouchTarget: Dp = 56.dp
)

val LocalCareLogDimensions = staticCompositionLocalOf { CareLogDimensions() }

@Composable
fun CareLogTheme(
    largeText: Boolean = false,
    highContrast: Boolean = false,
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = when {
            highContrast -> HighContrastColors
            darkTheme -> DarkColors
            else -> LightColors
        },
        typography = careLogTypography(largeText),
        shapes = CareLogShapes,
        content = content
    )
}
