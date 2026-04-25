package com.carelog.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.carelog.core.model.UserRole
import com.carelog.core.ui.theme.CareLogTheme
import com.carelog.feature.auth.AuthViewModel
import com.carelog.feature.auth.CircleSetupScreen
import com.carelog.feature.auth.OtpVerifyScreen
import com.carelog.feature.auth.PhoneLoginScreen
import com.carelog.feature.auth.RoleSelectionScreen
import com.carelog.feature.caregiver.CaregiverEmergencyScreen
import com.carelog.feature.caregiver.CaregiverHomeScreen
import com.carelog.feature.caregiver.CaregiverLogScreen
import com.carelog.feature.guardian.GuardianAlertScreen
import com.carelog.feature.guardian.GuardianHomeScreen
import com.carelog.feature.guardian.GuardianTimelineScreen
import com.carelog.feature.settings.SettingsScreen
import com.carelog.feature.settings.SettingsViewModel

private object Route {
    const val Phone = "auth_phone"
    const val Otp = "auth_otp"
    const val Role = "auth_role"
    const val CircleCaregiver = "auth_circle_caregiver"
    const val CircleGuardian = "auth_circle_guardian"

    const val CaregiverHome = "caregiver_home"
    const val CaregiverLog = "caregiver_log"
    const val CaregiverEmergency = "caregiver_emergency"

    const val GuardianHome = "guardian_home"
    const val GuardianTimeline = "guardian_timeline"
    const val GuardianAlert = "guardian_alert"

    const val Settings = "settings"
}

@Composable
fun CareLogNavHost() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val settingsViewModel: SettingsViewModel = hiltViewModel()
    val session by authViewModel.session.collectAsStateWithLifecycle()
    val uiSettings by settingsViewModel.settings.collectAsStateWithLifecycle()

    CareLogTheme(
        largeText = uiSettings.largeText,
        highContrast = uiSettings.highContrast
    ) {
        val startDestination = when {
            session == null -> Route.Phone
            session?.role == UserRole.CAREGIVER -> Route.CaregiverHome
            session?.role == UserRole.GUARDIAN -> Route.GuardianHome
            else -> Route.Role
        }

        NavHost(navController = navController, startDestination = startDestination) {
            composable(Route.Phone) {
                PhoneLoginScreen(onNext = { navController.navigate(Route.Otp) })
            }
            composable(Route.Otp) {
                OtpVerifyScreen(onNext = { navController.navigate(Route.Role) })
            }
            composable(Route.Role) {
                RoleSelectionScreen(
                    onCaregiver = { navController.navigate(Route.CircleCaregiver) },
                    onGuardian = { navController.navigate(Route.CircleGuardian) }
                )
            }
            composable(Route.CircleCaregiver) {
                CircleSetupScreen(role = UserRole.CAREGIVER, onDone = {
                    navController.navigate(Route.CaregiverHome) {
                        popUpTo(Route.Phone) { inclusive = true }
                    }
                })
            }
            composable(Route.CircleGuardian) {
                CircleSetupScreen(role = UserRole.GUARDIAN, onDone = {
                    navController.navigate(Route.GuardianHome) {
                        popUpTo(Route.Phone) { inclusive = true }
                    }
                })
            }

            composable(Route.CaregiverHome) {
                CaregiverHomeScreen(
                    onLog = { navController.navigate(Route.CaregiverLog) },
                    onEmergency = { navController.navigate(Route.CaregiverEmergency) },
                    onSettings = { navController.navigate(Route.Settings) }
                )
            }
            composable(Route.CaregiverLog) {
                CaregiverLogScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.CaregiverEmergency) {
                CaregiverEmergencyScreen(onBack = { navController.popBackStack() })
            }

            composable(Route.GuardianHome) {
                GuardianHomeScreen(
                    onTimeline = { navController.navigate(Route.GuardianTimeline) },
                    onAlert = { navController.navigate(Route.GuardianAlert) },
                    onSettings = { navController.navigate(Route.Settings) }
                )
            }
            composable(Route.GuardianTimeline) {
                GuardianTimelineScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.GuardianAlert) {
                GuardianAlertScreen(onBack = { navController.popBackStack() })
            }

            composable(Route.Settings) {
                SettingsScreen(
                    largeText = uiSettings.largeText,
                    highContrast = uiSettings.highContrast,
                    onLargeTextChanged = settingsViewModel::setLargeText,
                    onHighContrastChanged = settingsViewModel::setHighContrast,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
