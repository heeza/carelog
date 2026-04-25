package com.carelog.feature.guardian

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.carelog.core.model.EmergencyStatus
import com.carelog.core.ui.theme.CareLogColors
import com.carelog.core.ui.theme.careLogTouchTarget
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

@Composable
fun GuardianHomeScreen(
    onTimeline: () -> Unit,
    onAlert: () -> Unit,
    onSettings: () -> Unit,
    viewModel: GuardianViewModel = hiltViewModel()
) {
    val timeline by viewModel.timeline.collectAsStateWithLifecycle()
    val activeEmergency by viewModel.activeEmergency.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp)
    ) {
        Text("홈", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        if (activeEmergency != null) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("응급", color = CareLogColors.Danger, style = MaterialTheme.typography.titleLarge)
                    Text(activeEmergency!!.type.asKoreanLabel(), fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = onAlert,
                        modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
                        colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Danger)
                    ) {
                        Text("확인")
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onTimeline,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
            ) { Text("기록") }
            Button(
                onClick = onSettings,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
            ) { Text("설정") }
        }

        Spacer(Modifier.height(16.dp))
        Text("최근", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(timeline.take(8)) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp)) {
                        when {
                            item.log != null -> {
                                val time = item.log.occurredAt.toLocalDateTime(TimeZone.currentSystemDefault())
                                Text("${time.hour}:${time.minute.toString().padStart(2, '0')} 기록", fontWeight = FontWeight.Bold)
                                Text("식사 ${item.log.meal.asKoreanLabel()} · 복약 ${item.log.medication.asKoreanLabel()}")
                            }
                            item.emergency != null -> {
                                Text("응급 ${item.emergency.type.asKoreanLabel()}", color = CareLogColors.Danger, fontWeight = FontWeight.Bold)
                                Text("상태 ${item.emergency.status.asKoreanLabel()}")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GuardianTimelineScreen(
    onBack: () -> Unit,
    viewModel: GuardianViewModel = hiltViewModel()
) {
    val timeline by viewModel.timeline.collectAsStateWithLifecycle()
    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp)
    ) {
        Text("타임", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
        ) { Text("뒤로") }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(timeline) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp)) {
                        when {
                            item.log != null -> {
                                Text("일일 기록", fontWeight = FontWeight.Bold)
                                Text("컨디션 ${item.log.condition.asKoreanLabel()}")
                                if (item.log.note.isNotBlank()) Text(item.log.note)
                            }
                            item.emergency != null -> {
                                Text("응급", color = CareLogColors.Danger, fontWeight = FontWeight.Bold)
                                Text("${item.emergency.type.asKoreanLabel()} / ${item.emergency.status.asKoreanLabel()}")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GuardianAlertScreen(
    caregiverPhone: String = "01012341234",
    onBack: () -> Unit,
    viewModel: GuardianViewModel = hiltViewModel()
) {
    val activeEmergency by viewModel.activeEmergency.collectAsStateWithLifecycle()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("알림", style = MaterialTheme.typography.headlineLarge)
        activeEmergency?.let { emergency ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("응급 유형", color = CareLogColors.Danger)
                    Text(emergency.type.asKoreanLabel(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(if (emergency.note.isBlank()) "메모 없음" else emergency.note)
                    Text("상태 ${emergency.status}")
                }
            }
            Button(
                onClick = { viewModel.acknowledgeEmergency(emergency.id) },
                enabled = !uiState.isSubmitting,
                modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
            ) { Text(if (uiState.isSubmitting) "확인중" else "확인") }
        }
        uiState.error?.let { Text(it, color = CareLogColors.Danger) }
        Button(
            onClick = {
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$caregiverPhone"))
                context.startActivity(intent)
            },
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Danger)
        ) { Text("전화") }
        Button(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
        ) { Text("닫기") }

        activeEmergency?.takeIf { it.status != EmergencyStatus.ACTIVE }?.let {
            Text("응급 확인됨", color = CareLogColors.Good)
        }
    }
}

private fun Any.asKoreanLabel(): String = when (this) {
    com.carelog.core.model.MealStatus.COMPLETED -> "완료"
    com.carelog.core.model.MealStatus.PARTIAL -> "일부"
    com.carelog.core.model.MealStatus.MISSED -> "미완"
    com.carelog.core.model.MedicationStatus.COMPLETED -> "복용"
    com.carelog.core.model.MedicationStatus.MISSED -> "미복"
    com.carelog.core.model.ConditionStatus.GOOD -> "좋음"
    com.carelog.core.model.ConditionStatus.NORMAL -> "보통"
    com.carelog.core.model.ConditionStatus.BAD -> "나쁨"
    com.carelog.core.model.EmergencyType.UNCONSCIOUS -> "의식"
    com.carelog.core.model.EmergencyType.FALL -> "낙상"
    com.carelog.core.model.EmergencyType.BREATHING -> "호흡"
    com.carelog.core.model.EmergencyType.PAIN -> "통증"
    com.carelog.core.model.EmergencyType.OTHER -> "기타"
    EmergencyStatus.ACTIVE -> "활성"
    EmergencyStatus.ACKNOWLEDGED -> "확인"
    EmergencyStatus.RESOLVED -> "종료"
    else -> toString()
}
