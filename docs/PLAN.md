# CareLog — 개발 계획 및 설계

> 핸드오프 프로토타입(`index.html` + `*.jsx`)을 프로덕션 제품으로 발전시키기 위한 계획 문서.

---

## 1. 제품 요약

### 1.1 문제 정의
- 고령 부모를 돌보는 **보호자(caregiver, 주로 간병 가족/요양보호사)** 와 원격에서 관찰하는 **보호자 가족(guardian, 자녀/배우자)** 이 상태를 공유할 방법이 파편화되어 있음.
- 식사/복약/컨디션/이상증상이 전화·카톡으로 흘러가 **기록이 남지 않고 추세가 안 보임**.
- 응급 상황 발생 시 **신속 알림 + 한 번에 연락**이 어렵다.

### 1.2 핵심 사용자 & 역할
| 역할 | 설명 | 주요 화면 |
|---|---|---|
| Caregiver | 당사자와 같이 있는 사람. 매일 기록 · 응급 버튼 | `caregiverHome` / `caregiverLog` / `caregiverEmergency` / `caregiverCompanion` |
| Guardian | 원격 가족. 타임라인 열람 · 알림 수신 · 바로 전화 | `guardianHome` / `guardianTimeline` / `guardianAlert` / `guardianCall` |

### 1.3 MVP 스코프 (프로토타입에 이미 구현된 기능 기준)
1. **일일 로그**: 식사(완료/일부/미완), 복약(복용/미복용), 컨디션(좋음/보통/나쁨), 이상증상(없음/어지러움/통증/식욕저하/기타), 메모.
2. **응급 알림**: 5개 타입(의식이상 / 낙상 / 호흡 / 심한통증 / 기타) + 메모 → Guardian 푸시.
3. **Guardian 타임라인**: 시간순, 로그 상세, 응급 이력.
4. **One-tap 전화**: Guardian 알림에서 바로 caregiver에게 콜.
5. **Companion** (AI 상담·가이드 채팅 느낌의 보조 화면).
6. **설정**: 글자 크기(일반/큼), 테마 액센트, 역할 전환(데모).

---

## 2. 아키텍처 설계

### 2.1 타겟 스택 결정 (권장안)

| 영역 | 선택 | 근거 |
|---|---|---|
| 모바일 | **React Native (Expo)** | Caregiver/Guardian 모두 폰 사용. Expo로 푸시·응급전화(Linking.openURL('tel:'))·백그라운드 알림 빠르게. 프로토타입의 React 자산 재사용 가능. |
| 웹(관리자) | **Next.js 15 App Router** | 요양기관·관리자 대시보드용. SSR + RSC. |
| 백엔드 | **Supabase** (Postgres + Auth + Realtime + Storage + Edge Functions) | 소규모 팀으로 빠르게, Realtime이 응급 알림과 궁합 좋음. 유저·role·RLS 기본 제공. 후일 자체 운영 전환 시 Postgres 그대로 이관 가능. |
| 푸시 | **Expo Notifications + FCM/APNs** | 표준 경로. |
| 관측성 | **Sentry + Supabase Logs + PostHog** | 에러·사용패턴. |
| 결제(향후) | **Toss Payments** | 국내 구독. |

**대안 고려**
- Firebase: 실시간 DB는 편하지만 SQL 분석/관계 모델 약함 → 헬스 기록 특성상 Postgres 선호.
- 자체 NestJS + RDS: 초기 부담 큼. 사용자 100 도달 후 이전 검토.

### 2.2 데이터 모델 (Postgres)

```sql
-- 계정 및 케어 단위
profiles        (id uuid PK = auth.users.id, name, phone, role enum('caregiver','guardian','admin'), locale, avatar_url)
care_circles    (id, name, created_by, created_at)            -- 한 어르신 = 한 circle
circle_members  (circle_id, profile_id, role enum('caregiver','guardian','primary_guardian'), unique(circle_id, profile_id))
care_subjects   (id, circle_id, name, birth_date, notes)      -- 어르신 프로필

-- 일일 로그
logs (
  id uuid PK,
  circle_id fk,
  subject_id fk,
  author_id fk profiles,
  occurred_at timestamptz not null,
  meal enum('completed','partial','missed'),
  medication enum('completed','missed'),
  condition enum('good','normal','bad'),
  issue enum('none','dizziness','pain','low_appetite','other'),
  note text,
  created_at, updated_at
)

-- 응급 이벤트
emergencies (
  id uuid PK,
  circle_id fk,
  subject_id fk,
  triggered_by fk profiles,
  triggered_at timestamptz,
  type enum('unconscious','fall','breathing','pain','other'),
  note text,
  status enum('active','acknowledged','resolved'),
  acknowledged_by fk profiles null,
  acknowledged_at timestamptz null,
  resolved_at timestamptz null
)

-- 알림 전달 기록
notifications (
  id, user_id, kind, payload jsonb, read_at, delivered_at, channel enum('push','sms')
)

-- 복약 스케줄(향후)
medications    (id, subject_id, name, dose, schedule jsonb)
med_events     (id, medication_id, due_at, taken_at, status)
```

**RLS 원칙**: `profiles`은 본인만, `logs/emergencies`는 같은 `circle_id`의 멤버만.

### 2.3 실시간 경로

```
Caregiver 앱
  └─ triggerEmergency(type, note)
     └─ POST /api/emergencies
        └─ Postgres insert → Realtime publish
           └─ Guardian 앱 subscribe → 화면 전환(guardianAlert)
           └─ Edge Function → Expo Push → OS 알림
           └─ Edge Function → SMS fallback (5초 내 ACK 없으면)
```

일일 로그도 같은 경로로 실시간 반영(프로토타입의 `setLogs` 즉시 공유 UX 보존).

### 2.4 프론트엔드 구조 (React Native)

```
src/
├── app/                 # expo-router 기반
│   ├── (caregiver)/home.tsx
│   ├── (caregiver)/log.tsx
│   ├── (caregiver)/emergency.tsx
│   ├── (caregiver)/companion.tsx
│   ├── (guardian)/home.tsx
│   ├── (guardian)/timeline.tsx
│   ├── (guardian)/alert.tsx
│   └── settings.tsx
├── features/
│   ├── logs/   (hooks, screens, components, schemas)
│   ├── emergency/
│   ├── companion/
│   └── auth/
├── shared/
│   ├── ui/     (tokens, Icon, Button, Sheet)
│   ├── theme/  (Pretendard, OKLCH tokens from tokens.jsx)
│   └── lib/    (supabase client, push)
└── types/
```

프로토타입의 `tokens.jsx` → `shared/theme/tokens.ts`, `store.jsx` → Zustand + Supabase 채널로 대체.

---

## 3. 개발 로드맵

### Phase 0 — 준비 (1주)
- [ ] 디자인 토큰 확정(Pretendard + 의료 파랑 액센트, large font-size 지원 필수 — 고령자).
- [ ] Figma 또는 프로토타입 기준 스크린 맵 잠금.
- [ ] Supabase 프로젝트 생성, RLS 초안 작성.
- [ ] Expo 프로젝트 bootstrap + CI(Expo EAS).

### Phase 1 — MVP 기능 (3주)
- [ ] 인증: 전화번호 OTP(Supabase Phone Auth) + 역할 선택.
- [ ] Care Circle 생성·초대(딥링크 + 초대 코드).
- [ ] Caregiver 일일 로그 입력 폼(큰 버튼, 큰 글자, 2탭 완료).
- [ ] Guardian 타임라인 + 일별 요약.
- [ ] 응급 버튼 → Realtime 알림 → Guardian alert 화면 → `tel:` 콜.
- [ ] 기본 푸시 알림.

### Phase 2 — 안정성 & 사용성 (2주)
- [ ] 글자 크기/고대비 설정 영구 저장.
- [ ] 오프라인 로깅(AsyncStorage 큐 → 복구 시 sync).
- [ ] SMS fallback(응급 ACK 없을 때).
- [ ] 다국어 기초(ko-KR 기본, en 예비).
- [ ] 접근성 패스(VoiceOver/TalkBack, 터치 타깃 48dp).

### Phase 3 — Companion & 인사이트 (2주)
- [ ] Companion: Claude API 연동 질의응답(돌봄 FAQ, 약 상호작용, 식단 가이드).
  - 민감정보 비저장, per-user rate limit, prompt caching으로 비용 절감.
- [ ] Guardian 주간 리포트(평균 컨디션, 이상증상 빈도, 미복약 횟수).
- [ ] 복약 스케줄·리마인더.

### Phase 4 — 운영·성장 (상시)
- [ ] 요양기관(관리자) 웹 대시보드(Next.js).
- [ ] 수익 모델: 가족 1 circle 무료, 2+ circle 또는 기관은 월 구독.
- [ ] 백업/내보내기(CSV, PDF 주간 리포트).

---

## 4. 리스크 & 결정 사항

| 리스크 | 영향 | 대응 |
|---|---|---|
| 의료 앱 오인 | 규제 | "기록/알림 도구"로 명확히 포지셔닝, 의료 자문·진단 금지 문구. |
| 고령자 UX 실패 | 도입 이탈 | 초기부터 **큰 글자 모드 기본**, 현장 테스트 5인 이상. |
| 응급 알림 누락 | 치명적 | Push + SMS + 재시도 + ACK 타임아웃 알림. 매주 자가 테스트. |
| 개인정보(PIPA/HIPAA 유사) | 법적 | 한국 개인정보보호법 준수, 민감정보 암호화, 지역 DB(Seoul region). |
| 가족 간 접근권한 분쟁 | 신뢰 | 역할 분리(primary_guardian은 1인), 감사 로그. |

**결정 필요**
- [ ] 타겟 플랫폼: 네이티브 우선(RN) vs 웹 먼저? → 권장: **RN(Expo) + 웹 랜딩**.
- [ ] Supabase vs 자체 Postgres? → 권장: **Supabase로 시작**.
- [ ] 응급 시 SMS 비용 부담 주체? → 사용자 / 기관 / 기본 포함(월 수십 건) 중 택1.

---

## 5. 다음 액션 (즉시 실행)

1. `tokens.jsx` → TypeScript로 이식(`shared/theme/tokens.ts`).
2. Supabase 스키마 `supabase/migrations/0001_init.sql` 작성.
3. Expo 프로젝트 scaffold (`apps/mobile`), 모노레포 구조(`pnpm workspaces`).
4. Caregiver `Home` + `Log` 화면 마이그레이션(프로토타입 복제 기준).
5. Realtime 응급 채널 PoC (end-to-end 5초 이내 목표).
