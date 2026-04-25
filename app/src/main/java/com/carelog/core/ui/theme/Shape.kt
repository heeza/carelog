package com.carelog.core.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

object CareLogRadius {
    val Sm = 8.dp
    val Md = 12.dp
    val Lg = 16.dp
    val Xl = 20.dp
}

val CareLogShapes = Shapes(
    small = RoundedCornerShape(CareLogRadius.Sm),
    medium = RoundedCornerShape(CareLogRadius.Md),
    large = RoundedCornerShape(CareLogRadius.Lg)
)
