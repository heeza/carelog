package com.carelog.feature.caregiver

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.carelog.core.model.ConditionStatus
import com.carelog.core.model.EmergencyType
import com.carelog.core.model.IssueType
import com.carelog.core.model.MealStatus
import com.carelog.core.model.MedicationStatus
import com.carelog.core.ui.theme.CareLogColors
import com.carelog.core.ui.theme.careLogTouchTarget
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

@Composable
fun CaregiverHomeScreen(
    onLog: () -> Unit,
    onEmergency: () -> Unit,
    onSettings: () -> Unit,
    viewModel: CaregiverViewModel = hiltViewModel()
) {
    val logs by viewModel.logs.collectAsStateWithLifecycle()
    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp)
    ) {
        Text("홈", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        Text("오늘 기록 ${logs.size}건", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onLog,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
            ) { Text("기록") }
            Button(
                onClick = onEmergency,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Danger)
            ) { Text("응급") }
        }
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = onSettings,
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
        ) {
            Text("설정")
        }
        Spacer(Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(logs) { log ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp)) {
                        val time = log.occurredAt.toLocalDateTime(TimeZone.currentSystemDefault())
                        Text("${time.monthNumber}/${time.dayOfMonth} ${time.hour}:${time.minute.toString().padStart(2, '0')}", style = MaterialTheme.typography.bodyMedium)
                        Text("식사 ${log.meal.asKoreanLabel()} · 약 ${log.medication.asKoreanLabel()}", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                        if (log.note.isNotBlank()) {
                            Text(log.note, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CaregiverLogScreen(
    onBack: () -> Unit,
    viewModel: CaregiverViewModel = hiltViewModel()
) {
    var note by remember { mutableStateOf("") }
    var meal by remember { mutableStateOf(MealStatus.COMPLETED) }
    var medication by remember { mutableStateOf(MedicationStatus.COMPLETED) }
    var condition by remember { mutableStateOf(ConditionStatus.GOOD) }
    var issue by remember { mutableStateOf(IssueType.NONE) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.saveCompleted) {
        if (uiState.saveCompleted) {
            viewModel.consumeSaveResult()
            onBack()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp)
    ) {
        Text("기록", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(16.dp))
        ToggleRow("식사", MealStatus.entries, meal) { meal = it }
        Spacer(Modifier.height(12.dp))
        ToggleRow("복약", MedicationStatus.entries, medication) { medication = it }
        Spacer(Modifier.height(12.dp))
        ToggleRow("상태", ConditionStatus.entries, condition) { condition = it }
        Spacer(Modifier.height(12.dp))
        ToggleRow("특이사항", IssueType.entries, issue) { issue = it }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = note,
            onValueChange = { note = it },
            label = { Text("메모") },
            modifier = Modifier.fillMaxWidth()
        )
        uiState.message?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = if (uiState.saveCompleted) CareLogColors.Good else CareLogColors.Danger)
        }
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                viewModel.saveLog(meal, medication, condition, issue, note)
            },
            enabled = !uiState.isSaving,
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
        ) {
            Text(if (uiState.isSaving) "저장중" else "저장")
        }
    }
}

@Composable
private fun <T> ToggleRow(label: String, items: List<T>, selected: T, onSelect: (T) -> Unit) {
    Column {
        Text(label, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items.forEach { item ->
                val selectedItem = item == selected
                Button(
                    onClick = { onSelect(item) },
                    modifier = Modifier.weight(1f).careLogTouchTarget(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedItem) CareLogColors.AccentSoft else CareLogColors.Surface,
                        contentColor = if (selectedItem) CareLogColors.AccentDeep else CareLogColors.InkMuted
                    )
                ) {
                    Text(item.asKoreanLabel())
                }
            }
        }
    }
}

@Composable
fun CaregiverEmergencyScreen(
    onBack: () -> Unit,
    viewModel: CaregiverViewModel = hiltViewModel()
) {
    var selected by remember { mutableStateOf(EmergencyType.FALL) }
    var note by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(uiState.emergencySent) {
        if (uiState.emergencySent) {
            viewModel.consumeEmergencySent()
            onBack()
        }
    }
    Column(
        modifier = Modifier.fillMaxSize().background(CareLogColors.Bg).padding(20.dp)
    ) {
        Text("응급", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        ToggleRow("유형", EmergencyType.entries, selected) { selected = it }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = note,
            onValueChange = { note = it },
            label = { Text("메모") },
            modifier = Modifier.fillMaxWidth()
        )
        uiState.message?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = if (uiState.emergencySent) CareLogColors.Good else CareLogColors.Danger)
        }
        Spacer(Modifier.height(20.dp))
        Text("2단계 확인", style = MaterialTheme.typography.bodyMedium, color = CareLogColors.Danger)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onBack,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Surface, contentColor = CareLogColors.Ink)
            ) { Text("취소") }
            Button(
                onClick = {
                    viewModel.triggerEmergency(selected, note)
                },
                enabled = !uiState.isEmergencySending,
                modifier = Modifier.weight(1f).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Danger)
            ) { Text(if (uiState.isEmergencySending) "전송중" else "전송") }
        }
    }
}

private fun Any.asKoreanLabel(): String = when (this) {
    MealStatus.COMPLETED -> "완료"
    MealStatus.PARTIAL -> "일부"
    MealStatus.MISSED -> "미완"
    MedicationStatus.COMPLETED -> "복용"
    MedicationStatus.MISSED -> "미복"
    ConditionStatus.GOOD -> "좋음"
    ConditionStatus.NORMAL -> "보통"
    ConditionStatus.BAD -> "나쁨"
    IssueType.NONE -> "없음"
    IssueType.DIZZINESS -> "어지럼"
    IssueType.PAIN -> "통증"
    IssueType.LOW_APPETITE -> "식욕저하"
    IssueType.OTHER -> "기타"
    EmergencyType.UNCONSCIOUS -> "의식"
    EmergencyType.FALL -> "낙상"
    EmergencyType.BREATHING -> "호흡"
    EmergencyType.PAIN -> "통증"
    EmergencyType.OTHER -> "기타"
    else -> toString()
}
