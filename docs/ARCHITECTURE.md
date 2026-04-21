# CareLog — 아키텍처 설계

## 1. 시스템 다이어그램

```
┌─────────────────────┐        ┌─────────────────────┐
│  Caregiver App (RN) │        │  Guardian App (RN)  │
│  ─────────────────  │        │  ─────────────────  │
│  · 일일 로그        │        │  · 타임라인          │
│  · 응급 버튼        │        │  · 알림 수신         │
│  · Companion 채팅   │        │  · One-tap 콜        │
└──────────┬──────────┘        └──────────┬──────────┘
           │  HTTPS / WebSocket (Realtime) │
           └───────────────┬────────────────┘
                           ▼
                ┌─────────────────────┐
                │  Supabase Platform  │
                │  ─────────────────  │
                │  Auth (Phone OTP)   │
                │  Postgres + RLS     │
                │  Realtime (WS)      │
                │  Edge Functions     │
                │  Storage (avatars)  │
                └──────────┬──────────┘
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
  Expo Push            SMS (Twilio/         Claude API
  (FCM/APNs)           국내 SMS게이트웨이)   (Companion)
```

## 2. 주요 흐름

### 2.1 응급 알림 (E2E < 5초 목표)

```
1. Caregiver: [응급] 버튼 → 확인(2탭 보호)
2. Client: POST supabase.from('emergencies').insert(...)
3. Postgres: row insert → Realtime broadcasts to circle_id channel
4. Guardian app: subscribed → 화면 즉시 guardianAlert로 전환
5. Edge Function (DB webhook): Expo Push 발송
6. 5s 내 ack 없음 → SMS fallback
7. Guardian: [전화] 탭 → Linking.openURL('tel:' + caregiver.phone)
```

### 2.2 일일 로그 실시간 동기화
- Caregiver insert → 같은 circle의 Guardian 화면 timeline 자동 갱신.
- Supabase Realtime으로 `logs:circle_id=eq.{id}` 구독.

## 3. RLS 정책 예시

```sql
-- logs 테이블: circle 멤버만 read/write
create policy "logs_read" on logs
  for select using (
    exists (select 1 from circle_members
            where circle_id = logs.circle_id
              and profile_id = auth.uid())
  );

create policy "logs_insert" on logs
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from circle_members
                where circle_id = logs.circle_id
                  and profile_id = auth.uid()
                  and role in ('caregiver','primary_guardian'))
  );
```

## 4. 클라이언트 상태 관리

- **React Query**: 서버 상태(logs, emergencies, circle members).
- **Zustand**: UI 상태(현재 screen, tweaks, 설정).
- **Supabase Realtime**: 서버 이벤트 → React Query invalidate.

프로토타입의 `useCareLogStore`는 단일 훅이지만, 프로덕션에서는 **서버 진실 원본 + 캐시 레이어** 구조로 전환.

## 5. 접근성 원칙 (고령자 필수)

- 최소 터치 타깃: **48×48dp**
- 기본 폰트 크기: 17pt, 큰 글자 모드: 20pt
- 명도 대비 WCAG AA 이상(본문 7:1 목표)
- 모션 민감도: `prefers-reduced-motion` 대응
- 버튼 라벨 한글 2~4자 내 권장("기록", "응급", "연락")
- 응급 버튼은 **하단 중앙 고정**, 항상 도달 가능

## 6. 보안 & 개인정보

- 휴대폰 번호는 hash 검색, 원문은 RLS로 본인/써클만.
- 메모(note) 본문: 민감 가능성 → AES-256 at rest(Supabase 기본).
- 감사 로그: emergency 조회/처리 이력 별도 보관.
- 앱 삭제 시: 계정 삭제 요청 → 30일 유예 후 cascade delete.
- 해외 이전 없음(Seoul region 고정).

## 7. CI/CD

```
main branch
  ├─ PR open → GitHub Actions
  │    ├─ pnpm lint
  │    ├─ pnpm typecheck
  │    └─ pnpm test
  ├─ main merge
  │    └─ EAS build (preview)
  └─ tag v* → EAS submit (store)
```

Supabase migrations: `supabase db push` via CI on merge.

## 8. 관측성

| 도구 | 용도 |
|---|---|
| Sentry | JS 에러, crash |
| PostHog | 사용 이벤트(로그 작성 횟수, 응급 버튼 사용) |
| Supabase Logs | DB 쿼리, Edge Function |
| Expo OTA | 긴급 핫픽스 |

핵심 KPI: **일일 로그 작성 유지율(D7, D30)**, **응급 알림 수신 ACK 시간**, **앱 오픈 → 로그 저장까지 단계 수**.
