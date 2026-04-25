package com.carelog.feature.auth

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.carelog.core.model.UserRole
import com.carelog.core.ui.theme.CareLogColors
import com.carelog.core.ui.theme.careLogTouchTarget

@Composable
fun PhoneLoginScreen(
    onNext: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CareLogColors.Bg)
            .padding(20.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("로그인", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        Text("휴대폰 번호를 입력하세요", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = state.phone,
            onValueChange = viewModel::updatePhone,
            label = { Text("전화번호") },
            modifier = Modifier.fillMaxWidth()
        )
        state.error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = CareLogColors.Danger, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                viewModel.requestOtp()
                onNext()
            },
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
        ) {
            Text("인증")
        }
    }
}

@Composable
fun OtpVerifyScreen(
    onNext: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CareLogColors.Bg)
            .padding(20.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("인증", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(12.dp))
        Text("테스트 코드는 123456", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = state.otp,
            onValueChange = viewModel::updateOtp,
            label = { Text("인증번호") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                viewModel.verifyOtp()
                onNext()
            },
            modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
            colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
        ) {
            Text("확인")
        }
    }
}

@Composable
fun RoleSelectionScreen(
    onCaregiver: () -> Unit,
    onGuardian: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CareLogColors.Bg)
            .padding(20.dp)
    ) {
        Spacer(Modifier.height(24.dp))
        Text("역할", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(8.dp))
        Text("하나를 선택하세요", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(20.dp))
        RoleCard(
            title = "돌봄자",
            subtitle = "어르신 곁에서 기록",
            onClick = {
                viewModel.selectRole(UserRole.CAREGIVER)
                onCaregiver()
            }
        )
        Spacer(Modifier.height(14.dp))
        RoleCard(
            title = "보호자",
            subtitle = "원격으로 확인",
            onClick = {
                viewModel.selectRole(UserRole.GUARDIAN)
                onGuardian()
            }
        )
    }
}

@Composable
private fun RoleCard(title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text(subtitle, style = MaterialTheme.typography.bodyMedium)
            }
            Button(
                onClick = onClick,
                modifier = Modifier.width(96.dp).careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.AccentSoft, contentColor = CareLogColors.AccentDeep)
            ) {
                Text("선택")
            }
        }
    }
}

@Composable
fun CircleSetupScreen(
    role: UserRole,
    onDone: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    CircleContent(
        role = role,
        inviteCode = state.session?.circleInviteCode.orEmpty(),
        onCreate = {
            viewModel.createCircle("가족써클")
            onDone()
        },
        onJoin = { code ->
            viewModel.joinCircle(code)
            onDone()
        }
    )
}

@Composable
private fun CircleContent(
    role: UserRole,
    inviteCode: String,
    onCreate: () -> Unit,
    onJoin: (String) -> Unit
) {
    var joinCode by remember { mutableStateOf("") }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CareLogColors.Bg)
            .padding(20.dp)
    ) {
        Spacer(Modifier.height(28.dp))
        Text("써클", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(8.dp))
        if (role == UserRole.CAREGIVER) {
            Text("가족 초대 코드를 만드세요", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onCreate,
                modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
            ) { Text("생성") }
            if (inviteCode.isNotBlank()) {
                Spacer(Modifier.height(14.dp))
                Text("초대코드: $inviteCode", style = MaterialTheme.typography.titleLarge)
            }
        } else {
            Text("초대 코드를 입력하세요", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))
            OutlinedTextField(
                value = joinCode,
                onValueChange = { joinCode = it.uppercase() },
                label = { Text("초대코드") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { onJoin(joinCode) },
                modifier = Modifier.fillMaxWidth().careLogTouchTarget(),
                colors = ButtonDefaults.buttonColors(containerColor = CareLogColors.Accent)
            ) { Text("참여") }
        }
    }
}
