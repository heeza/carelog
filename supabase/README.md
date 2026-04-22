# Supabase — CareLog

## 프로젝트 생성
1. https://supabase.com/dashboard → New project
2. Region: **Northeast Asia (Seoul)**
3. DB password 안전하게 저장

## 환경 변수 (Android 앱에 필요)
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon>
# 서버 전용 (Edge Function에서만)
SUPABASE_SERVICE_ROLE_KEY=<service>
FCM_SERVER_KEY=<firebase cloud messaging key>
```

## 마이그레이션 적용
Studio SQL editor에 `migrations/0001_init.sql` 붙여넣기 → Run.
또는 CLI:
```bash
supabase link --project-ref <ref>
supabase db push
```

## Edge Functions 배포
```bash
supabase functions deploy emergency-dispatch \
  --no-verify-jwt
supabase secrets set FCM_SERVER_KEY=<key>
```
Database Webhook 설정: Studio → Database → Webhooks → New
- Table: `emergencies`
- Events: `INSERT`
- Type: Supabase Edge Functions → `emergency-dispatch`

## Auth 설정
- **Phone Auth** 활성화 (한국 SMS provider는 제한 → 초기는 이메일+이름, 정식 출시 전 교체)
- Redirect URL: `io.carelog://auth/callback`

## Realtime
`logs`, `emergencies` 테이블은 `supabase_realtime` publication에 자동 등록 (마이그레이션에 포함).

## RLS 검증
```sql
-- 다른 circle 사용자로 접근 시 빈 결과 확인
select * from logs;
-- 본인 circle인지 확인
select * from circle_members where profile_id = auth.uid();
```
