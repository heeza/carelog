package com.carelog.core.ui.theme

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

fun Modifier.careLogDescription(description: String): Modifier =
    this.semantics { contentDescription = description }
