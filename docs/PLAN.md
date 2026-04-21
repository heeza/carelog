# CareLog — 개발 계획 (Android Native)

> 타겟: **Android 네이티브만**. Kotlin + Jetpack Compose.
> 프로토타입(`index.html` + `*.jsx`)은 **디자인 참조용**으로만 사용하고, 코드는 전량 새로 작성.

---

## 1. 제품 요약

### 1.1 역할
| 역할 | 설명 | 주요 화면 |
|---|---|---|
| Caregiver | 어르신 옆에서 기록하는 사람 | Home / Log / Emergency / Companion / Settings |
| Guardian | 원격 가족 | Home / Timeline / Alert / Call / Settings |

### 1.2 MVP 기능 (프로토타입 기준)
1. 일일 로그: 식사·복약·컨디션·이상증상·메모
2. 응급 알림 5종(의식이상/낙상/호흡/통증/기타)
3. Guardian 타임라인 + 실시간 갱신
4. One-tap 전화
5. Companion 채팅(AI 돌봄 Q&A) — Phase 3
6. 설정(글자 크기·테마)

---

## 2. 기술 스택 (Android Native)

| 영역 | 선택 | 근거 |
|---|---|---|
| 언어 | **Kotlin 2.0** | 표준. |
| UI | **Jetpack Compose** (Material 3) | 선언형, 프로토타입 JSX 이식이 자연스러움. |
| 최소 지원 | **minSdk 26 (Android 8)** / targetSdk 34 | 고령자 폰도 커버, 보안·푸시 최신. |
| DI | **Hilt** | 표준, Compose/테스트 친화. |
| 네트워크 | **Ktor Client** + kotlinx.serialization | 경량. (Retrofit도 가능하지만 KMP 확장성 위해 Ktor.) |
| 로컬 DB | **Room** | 오프라인 로깅·복약 이력. |
| 상태 | **ViewModel + StateFlow** + **Molecule/Compose State** | Compose 표준. |
| 비동기 | **Coroutines + Flow** | 표준. |
| 내비게이션 | **Navigation Compose** (type-safe routes, 2.8+) | |
| 이미지 | **Coil 3** | Compose 네이티브. |
| 설정 | **DataStore (Proto)** | SharedPreferences 대체. |
| 푸시 | **Firebase Cloud Messaging (FCM)** | Android 표준, 무료. |
| 크래시/로깅 | **Firebase Crashlytics** + **Timber** | |
| 분석 | **Firebase Analytics** 또는 **PostHog** | 이벤트 트래킹. |
| 폰트 | **Pretendard** (assets 번들) | 디자인 토큰 일치. |
| 빌드 | **Gradle KTS** + Version Catalog (`libs.versions.toml`) | |

### 백엔드
| 영역 | 선택 | 근거 |
|---|---|---|
| 서버 | **Ktor 3 서버** on 간단한 VM/Container, 또는 **Supabase** | 팀 규모 작으면 Supabase 권장(Auth/Realtime/Postgres/푸시 트리거 편함). Ktor 서버 직접 하려면 Spring Boot 대안도 OK. |
| DB | **PostgreSQL** | 관계·쿼리·RLS. |
| 실시간 | Supabase Realtime 또는 WebSocket + FCM | 응급 알림 즉시 전파. |
| 인증 | Supabase Phone OTP 또는 자체 SMS OTP | 휴대폰 번호 로그인(고령자 친화). |
| 파일 | Supabase Storage 또는 S3 | 아바타·첨부 사진. |

> **권장 조합**: **Android(Kotlin+Compose) + Supabase**. 서버 코드 거의 안 쓰고 RLS로 권한 처리. 이후 규모 커지면 Ktor 자체 서버로 전환.

---

## 3. 프로젝트 구조

```
app/
├─ src/main/java/com/carelog/
│  ├─ CareLogApp.kt                  # Hilt Application
│  ├─ MainActivity.kt
│  ├─ core/
│  │  ├─ ui/theme/                   # Color.kt, Type.kt, Shape.kt, Theme.kt
│  │  ├─ ui/components/              # Button, Chip, Sheet, BigTapTarget
│  │  ├─ data/                       # Supabase/Ktor client, Room DB
│  │  ├─ network/
│  │  └─ di/
│  ├─ feature/
│  │  ├─ auth/                       # 로그인, 역할 선택, 써클 초대
│  │  ├─ caregiver/
│  │  │  ├─ home/
│  │  │  ├─ log/
│  │  │  ├─ emergency/
│  │  │  └─ companion/
│  │  ├─ guardian/
│  │  │  ├─ home/
│  │  │  ├─ timeline/
│  │  │  ├─ alert/
│  │  │  └─ call/
│  │  └─ settings/
│  └─ navigation/
│     └─ CareLogNavHost.kt
└─ src/test / androidTest
```

모듈 분리는 Phase 2에서 `:feature:*`, `:core:*`로 멀티모듈화.

---

## 4. 데이터 모델

```kotlin
// Kotlin (DTO via kotlinx.serialization)
@Serializable data class Log(
  val id: String,
  val circleId: String,
  val subjectId: String,
  val authorId: String,
  val occurredAt: Instant,
  val meal: MealStatus,          // COMPLETED, PARTIAL, MISSED
  val medication: MedStatus,      // COMPLETED, MISSED
  val condition: Condition,       // GOOD, NORMAL, BAD
  val issue: Issue,               // NONE, DIZZINESS, PAIN, LOW_APPETITE, OTHER
  val note: String?,
)

@Serializable data class Emergency(
  val id: String,
  val circleId: String,
  val triggeredBy: String,
  val triggeredAt: Instant,
  val type: EmergencyType,        // UNCONSCIOUS, FALL, BREATHING, PAIN, OTHER
  val note: String?,
  val status: Status,             // ACTIVE, ACKNOWLEDGED, RESOLVED
)
```

Room 엔티티는 동일 스키마 + `pendingSync: Boolean`(오프라인 큐).

---

## 5. 로드맵

### Phase 0 — 셋업 (3일)
- [ ] Android Studio 프로젝트(`com.carelog`) 생성, Compose + Hilt 템플릿
- [ ] `libs.versions.toml` 버전 카탈로그 구성
- [ ] 디자인 토큰 이식(`tokens.jsx` → `core/ui/theme/Color.kt`, `Type.kt`)
- [ ] Pretendard 폰트 에셋 추가
- [ ] Supabase 프로젝트 생성, `schema.sql` + RLS

### Phase 1 — MVP (3주)
- [ ] 휴대폰 OTP 로그인 + 역할 선택
- [ ] Care Circle 생성 / 초대 코드
- [ ] Caregiver: Home / Log (2탭 저장)
- [ ] Guardian: Home / Timeline (Realtime 반영)
- [ ] 응급 버튼 → Realtime → Guardian Alert 화면
- [ ] FCM 푸시 연결
- [ ] `tel:` 인텐트 전화 연결

### Phase 2 — 안정성·접근성 (2주)
- [ ] 큰 글자 모드 / 고대비 테마 (시스템 폰트 크기 + 앱 설정 중첩)
- [ ] 오프라인 로그 큐 (Room + WorkManager sync)
- [ ] 응급 ACK 타임아웃 → SMS fallback
- [ ] 접근성 감사(TalkBack, 터치 48dp, 대비 AA)
- [ ] Crashlytics·Analytics 연동

### Phase 3 — Companion & 인사이트 (2주)
- [ ] Claude API Companion 채팅 (PII 필터 + rate limit)
- [ ] Guardian 주간 리포트
- [ ] 복약 스케줄·리마인더 (AlarmManager + Notification)

### Phase 4 — 출시 (1주)
- [ ] Play Console 등록, 개인정보처리방침·이용약관
- [ ] 내부 테스트 → 폐쇄 베타 → 프로덕션
- [ ] Play Store 스크린샷·설명 (Pretendard 기반 마케팅 이미지)

---

## 6. 고령자 UX 원칙 (필수)

| 항목 | 기준 |
|---|---|
| 최소 터치 타깃 | **56×56dp** (일반 가이드 48dp보다 보수적) |
| 기본 폰트 크기 | body 17sp, 큰 글자 모드 20sp, 제목 24/28sp |
| 명도 대비 | WCAG AAA (본문 7:1) |
| 한글 라벨 | 버튼 2~4자 ("기록", "응급", "연락", "완료") |
| 응급 버튼 | 하단 **고정 FAB**, 한 손 도달 가능 위치 |
| 모션 | `prefers-reduced-motion` 대응, 기본도 느리게(300ms) |
| 실수 방지 | 응급·삭제는 2탭 확인 (탭 → 꾹 누르기 말고 명시적 확인) |

---

## 7. 보안·개인정보 (한국 PIPA)

- 서울 리전 DB, 해외 이전 없음
- 휴대폰번호는 해시 검색용 + 원문은 본인/써클 RLS
- 메모 AES-256 at rest (Supabase 기본 제공)
- 감사 로그: 응급 이벤트 조회·처리 이력 별도
- 계정 삭제 요청 30일 유예 후 cascade
- Play Data Safety 공시 필수: 건강/위치 관련 데이터 용도 명시

---

## 8. 리스크 · 결정 필요

| 리스크 | 대응 |
|---|---|
| 의료기기 오인 → 규제 | "기록·알림 도구" 명시, 진단 문구 금지 |
| 응급 알림 누락 | Push + SMS + ACK 재시도, 주기 자가 테스트 |
| 고령자 이탈 | 현장 유저 5인 UT 필수 |

**결정 필요**
- [ ] 백엔드: **Supabase** vs 자체 Ktor/Spring? (권장: Supabase)
- [ ] 응급 SMS 비용 부담 주체?
- [ ] Companion AI 모델: **Claude Haiku 4.5** (비용) vs Sonnet 4.6 (품질)?
- [ ] Play Store 단독 배포, 원스토어 동시?

---

## 9. 즉시 실행 과제

1. Android Studio 프로젝트 bootstrap + Version Catalog
2. `tokens.jsx` → `Color.kt` / `Type.kt` / `Shape.kt` 이식
3. Supabase 스키마 + RLS SQL 파일 작성
4. Caregiver Home 화면 Compose로 1화면 복제 (프로토타입 픽셀 일치 확인)
5. FCM 샘플 알림 수신 테스트
