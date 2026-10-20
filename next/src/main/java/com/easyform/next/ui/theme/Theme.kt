package com.easyform.next.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.shape.RoundedCornerShape

/** The app's colours, from the existing design (brand blue, the grey scale the cards use). Used through MaterialTheme only. */
object Palette {
    val Brand = Color(0xFF2A3086)
    val Page = Color(0xFFFCFCFC)
    val Surface = Color(0xFFECEDEF)
    val Line = Color(0xFFE3E6EA)
    val Ink = Color(0xFF111827)
    val Muted = Color(0xFF6B7280)
    val Good = Color(0xFF2E7D32)
    val Bad = Color(0xFFD32F2F)

    val DarkPage = Color(0xFF080B17)
    val DarkSurface = Color(0xFF20232B)
    val DarkInk = Color(0xFFFFFFFF)
    val DarkMuted = Color(0xFFB8BBC3)
    val DarkBrand = Color(0xFF9FA6F2)
}

private val Light = lightColorScheme(
    primary = Palette.Brand, onPrimary = Color.White,
    background = Palette.Page, onBackground = Palette.Ink,
    surface = Palette.Page, onSurface = Palette.Ink,
    surfaceVariant = Palette.Surface, onSurfaceVariant = Palette.Muted,
    outlineVariant = Palette.Line, error = Palette.Bad,
)

private val Dark = darkColorScheme(
    primary = Palette.DarkBrand, onPrimary = Color(0xFF10124A),
    background = Palette.DarkPage, onBackground = Palette.DarkInk,
    surface = Palette.DarkPage, onSurface = Palette.DarkInk,
    surfaceVariant = Palette.DarkSurface, onSurfaceVariant = Palette.DarkMuted,
    outlineVariant = Color(0xFF444444), error = Color(0xFFFF8A80),
)

private val AppTypography = Typography(
    titleLarge = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.SemiBold, lineHeight = 28.sp),
    titleMedium = TextStyle(fontSize = 17.sp, fontWeight = FontWeight.SemiBold, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, letterSpacing = 0.4.sp),
    labelSmall = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium),
)

private val AppShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp),
)

@Composable
fun MwfmTheme(dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (dark) Dark else Light, typography = AppTypography, shapes = AppShapes, content = content)
}
