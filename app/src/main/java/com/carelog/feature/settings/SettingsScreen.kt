package com.carelog.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.carelog.core.ui.theme.CareLogColors
import com.carelog.core.ui.theme.careLogTouchTarget

@Composable
fun SettingsScreen(
    largeText: Boolean,
    highContrast: Boolean,
    onLargeTextChanged: (Boolean) -> Unit,
    onHighContrastChanged: (Boolean) -> Unit,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CareLogColors.Bg)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("설정", style = MaterialTheme.typography.headlineLarge)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("큰글자", style = MaterialTheme.typography.titleLarge)
            Switch(
                checked = largeText,
                onCheckedChange = onLargeTextChanged,
                modifier = Modifier
                    .careLogTouchTarget()
                    .semantics { contentDescription = "큰글자 모드 스위치" }
            )
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("고대비", style = MaterialTheme.typography.titleLarge)
            Switch(
                checked = highContrast,
                onCheckedChange = onHighContrastChanged,
                modifier = Modifier
                    .careLogTouchTarget()
                    .semantics { contentDescription = "고대비 모드 스위치" }
            )
        }
        Button(
            onClick = onBack,
            modifier = Modifier
                .fillMaxWidth()
                .careLogTouchTarget()
                .semantics { contentDescription = "설정 뒤로가기 버튼" },
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
        ) {
            Text("뒤로")
        }
    }
}
