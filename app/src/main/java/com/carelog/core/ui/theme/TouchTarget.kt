package com.carelog.core.ui.theme

import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun Modifier.careLogTouchTarget(): Modifier {
    val size = LocalCareLogDimensions.current.minTouchTarget
    return this.defaultMinSize(minWidth = size, minHeight = size)
}
