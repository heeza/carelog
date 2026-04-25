package com.carelog.core.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.carelog.R

val Pretendard = FontFamily(
    Font(R.font.pretendard_regular, FontWeight.Normal),
    Font(R.font.pretendard_medium, FontWeight.Medium),
    Font(R.font.pretendard_semibold, FontWeight.SemiBold),
    Font(R.font.pretendard_bold, FontWeight.Bold)
)

fun careLogTypography(largeText: Boolean): Typography {
    val bodySize = if (largeText) 20.sp else 17.sp
    val titleSize = if (largeText) 28.sp else 24.sp
    return Typography(
        headlineLarge = TextStyle(
            fontFamily = Pretendard,
            fontWeight = FontWeight.Bold,
            fontSize = titleSize,
            lineHeight = titleSize * 1.25f
        ),
        titleLarge = TextStyle(
            fontFamily = Pretendard,
            fontWeight = FontWeight.SemiBold,
            fontSize = if (largeText) 24.sp else 20.sp,
            lineHeight = if (largeText) 30.sp else 25.sp
        ),
        bodyLarge = TextStyle(
            fontFamily = Pretendard,
            fontWeight = FontWeight.Normal,
            fontSize = bodySize,
            lineHeight = bodySize * 1.4f
        ),
        bodyMedium = TextStyle(
            fontFamily = Pretendard,
            fontWeight = FontWeight.Normal,
            fontSize = if (largeText) 18.sp else 15.sp,
            lineHeight = if (largeText) 26.sp else 22.sp
        ),
        labelLarge = TextStyle(
            fontFamily = Pretendard,
            fontWeight = FontWeight.SemiBold,
            fontSize = if (largeText) 18.sp else 15.sp,
            lineHeight = if (largeText) 22.sp else 18.sp
        )
    )
}
