# CareLog — 아키텍처 (Android Native)

## 1. 시스템 구성

```
┌────────────────────────┐        ┌────────────────────────┐
│ Caregiver Android App  │        │ Guardian Android App   │
│ (Kotlin + Compose)     │        │ (동일 APK, 역할만 구분) │
└────────────┬───────────┘        └───────────┬────────────┘
             │  HTTPS / WebSocket              │
             └─────────────────┬───────────────┘
                               ▼
                    ┌────────────────────┐
                    │ Supabase (Seoul)   │
                    │ · Auth (Phone OTP) │
                    │ · Postgres + RLS   │
                    │ · Realtime (WS)    │
                    │ · Edge Functions   │
                    └─────────┬──────────┘
                              │
               ┌──────────────┼────────────────┐
               ▼              ▼                ▼
           FCM Push      SMS (NHN Toast)   Claude API
                                           (Companion)
```

**한 APK, 두 역할**: 사용자가 로그인 시 `role` 선택 → 네비게이션 그래프를 caregiver/guardian으로 분기. 공통 UI·데이터 레이어 재사용.

## 2. 레이어 구조

```
Presentation (Compose UI + ViewModel + StateFlow)
        │
        ▼
Domain (UseCases, Pure Kotlin)
        │
        ▼
Data (Repository)
   ├─ Remote: Supabase Client / Ktor
   └─ Local:  Room DAO + DataStore
```

- Repository는 단일 진실 원본. Remote 실패 시 Room 캐시 반환.
- Realtime 이벤트 → Repository에서 Flow로 방출 → ViewModel이 구독.

## 3. 응급 알림 E2E (목표: 5초 이내)

```
1. Caregiver: [응급] 버튼 long-press 또는 2탭 확인
2. App → supabase.from("emergencies").insert(..)
3. Postgres insert → Realtime broadcast(channel = "circle:{id}")
4. Guardian app(전경/백그라운드 모두):
    · 전경: Realtime 구독으로 즉시 화면 전환
    · 백그라운드: Edge Function → FCM high-priority push → 잠금화면 알림
5. Edge Function: 5초 내 ack 없음 → SMS 발송
6. Guardian [전화] 탭 → Intent.ACTION_DIAL tel:caregiver-phone
```

ACK는 `emergencies.acknowledged_by` 컬럼 update로 기록. Realtime으로 Caregiver도 "가족이 확인함" 상태 확인 가능.

## 4. Compose 테마 설계

```kotlin
// core/ui/theme/Color.kt — tokens.jsx 포팅
object CareLogColors {
  val Accent       = Color(0xFF3B7A9E)
  val AccentDeep   = Color(0xFF2A5E7E)
  val AccentSoft   = Color(0xFFE7EEF5)
  val Ink          = Color(0xFF0F1B2A)
  val InkMuted     = Color(0xFF4A5A6E)
  val Good         = Color(0xFF4C8A5E)
  val Warn         = Color(0xFFB5761F)
  val Danger       = Color(0xFFC2453A)
  // ...
}

// core/ui/theme/Type.kt
val Pretendard = FontFamily(
  Font(R.font.pretendard_regular, FontWeight.Normal),
  Font(R.font.pretendard_medium,  FontWeight.Medium),
  Font(R.font.pretendard_semibold,FontWeight.SemiBold),
  Font(R.font.pretendard_bold,    FontWeight.Bold),
)

// 글자 크기 설정 → LocalDensity/LocalTextStyle을 통해 앱 전역 스케일 적용
val bodyLarge = TextStyle(fontFamily = Pretendard, fontSize = 17.sp)
```

## 5. 네비게이션

```kotlin
sealed interface Route {
  @Serializable data object CaregiverHome : Route
  @Serializable data object CaregiverLog : Route
  @Serializable data class  CaregiverEmergency(val prefill: String? = null) : Route
  @Serializable data object GuardianHome : Route
  @Serializable data object GuardianTimeline : Route
  @Serializable data class  GuardianAlert(val emergencyId: String) : Route
  @Serializable data object Settings : Route
}

NavHost(navController, startDestination = roleStart) {
  composable<Route.CaregiverHome> { CaregiverHomeScreen(vm = hiltViewModel(), onNav = ...) }
  // ...
}
```

Navigation Compose 2.8+ type-safe routes 사용.

## 6. RLS 정책 (Supabase)

```sql
-- circle 멤버만 logs 읽기
create policy "logs_read" on logs for select using (
  exists (select 1 from circle_members
          where circle_id = logs.circle_id and profile_id = auth.uid())
);

-- caregiver 역할만 로그 작성
create policy "logs_insert" on logs for insert with check (
  author_id = auth.uid()
  and exists (select 1 from circle_members
              where circle_id = logs.circle_id and profile_id = auth.uid()
              and role = 'caregiver')
);

-- 응급 트리거: caregiver 전용, ACK은 guardian 전용
create policy "emergencies_insert" on emergencies for insert with check (
  triggered_by = auth.uid()
  and exists (select 1 from circle_members
              where circle_id = emergencies.circle_id and profile_id = auth.uid()
              and role = 'caregiver')
);
```

## 7. 오프라인 로깅

```kotlin
interface LogRepository {
  fun observe(circleId: String): Flow<List<Log>>
  suspend fun submit(draft: LogDraft): Result<Log>  // insert with retry
}

// Room에 pendingSync=true 로 저장 → WorkManager가 네트워크 복구 시 push
```

WorkManager `ExpeditedWorkRequest`로 백그라운드 sync.

## 8. 보안

- **API 키**: Supabase `anon key`는 RLS 전제로 앱에 내장 가능. `service_role`은 서버(Edge Function)에서만.
- **딥링크**: 초대 코드 URL 서명, 10분 만료
- **Root/디버거 탐지**: Play Integrity API
- **네트워크 보안**: `networkSecurityConfig`로 cleartext 금지
- **ProGuard/R8**: release 빌드 난독화 + 리소스 축소

## 9. 테스트 전략

| 레벨 | 도구 | 커버리지 |
|---|---|---|
| 단위 | JUnit5, MockK, Turbine | Domain/ViewModel 90%+ |
| UI | Compose UI Test, Paparazzi(스냅샷) | 주요 화면 |
| 통합 | Hilt Testing + Supabase local(postgrest-js로 stub) | API 레이어 |
| 계측 | Firebase Test Lab (여러 실기기) | 주 1회 smoke |

## 10. 성능 목표

| 항목 | 목표 |
|---|---|
| 콜드 스타트 | < 1.5s (중급 디바이스, Android 9+) |
| 로그 저장 탭 → 저장 완료 | < 400ms (오프라인 포함, 낙관적 UI) |
| 응급 버튼 → Guardian 알림 | < 5s E2E |
| APK 크기 | < 15MB (Baseline, Pretendard 포함) |
| Jank | Dropped frames < 0.1% (Macrobenchmark) |

## 11. 관측성

- **Crashlytics**: 크래시·ANR
- **Firebase Performance**: 주요 트레이스(로그 저장, 응급 알림)
- **Analytics 이벤트**:
  - `log_submitted{meal, medication, condition}`
  - `emergency_triggered{type}`
  - `emergency_ack_latency_ms`
  - `companion_message_sent`
- **KPI 대시보드**: D7/D30 retention, 일일 로그/DAU 비율, 응급 ACK 중앙값.

## 12. 배포

```
feature/* branch → PR
   └─ GitHub Actions: ktlint, detekt, unit test, build debug APK
main merge
   └─ EAS... 아니 — Gradle assembleRelease → Firebase App Distribution (내부 테스터)
tag v1.x.x
   └─ bundleRelease (.aab) → Play Console upload (gradle-play-publisher)
```

Play Store: 내부 테스트 → 비공개(closed) 베타 → 프로덕션 점진 출시(10% → 50% → 100%).
