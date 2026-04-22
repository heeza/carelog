-- CareLog initial schema
-- Supabase (Postgres 15+). Run via `supabase db push` or Studio SQL editor.

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────────────────────
create type member_role   as enum ('caregiver','guardian','primary_guardian','admin');
create type meal_status   as enum ('completed','partial','missed');
create type med_status    as enum ('completed','missed');
create type condition_lvl as enum ('good','normal','bad');
create type issue_kind    as enum ('none','dizziness','pain','low_appetite','other');
create type emergency_type as enum ('unconscious','fall','breathing','pain','other');
create type emergency_status as enum ('active','acknowledged','resolved');

-- ──────────────────────────────────────────────────────────────
-- profiles (mirrors auth.users)
-- ──────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text unique,
  avatar_url text,
  locale text default 'ko-KR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;

create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);
create policy "profiles_self_write" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- also allow circle mates to read each other
create policy "profiles_circle_read" on profiles for select using (
  exists (
    select 1 from circle_members m1
    join circle_members m2 on m1.circle_id = m2.circle_id
    where m1.profile_id = auth.uid() and m2.profile_id = profiles.id
  )
);

-- ──────────────────────────────────────────────────────────────
-- care_circles (하나 = 한 어르신을 중심으로 한 돌봄 그룹)
-- ──────────────────────────────────────────────────────────────
create table care_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table care_circles enable row level security;

create table care_subjects (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  name text not null,
  birth_date date,
  notes text,
  created_at timestamptz default now()
);
alter table care_subjects enable row level security;

-- ──────────────────────────────────────────────────────────────
-- circle_members
-- ──────────────────────────────────────────────────────────────
create table circle_members (
  circle_id uuid references care_circles(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role member_role not null,
  joined_at timestamptz default now(),
  primary key (circle_id, profile_id)
);
alter table circle_members enable row level security;

create policy "members_read_own_circles" on circle_members
  for select using (
    exists (select 1 from circle_members m
            where m.circle_id = circle_members.circle_id
              and m.profile_id = auth.uid())
  );

create policy "circles_read_member" on care_circles for select using (
  exists (select 1 from circle_members
          where circle_id = care_circles.id and profile_id = auth.uid())
);

create policy "subjects_read_member" on care_subjects for select using (
  exists (select 1 from circle_members
          where circle_id = care_subjects.circle_id and profile_id = auth.uid())
);

-- ──────────────────────────────────────────────────────────────
-- logs (일일 기록)
-- ──────────────────────────────────────────────────────────────
create table logs (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  subject_id uuid not null references care_subjects(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  meal meal_status,
  medication med_status,
  condition condition_lvl,
  issue issue_kind default 'none',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index logs_circle_occurred_idx on logs (circle_id, occurred_at desc);
alter table logs enable row level security;

create policy "logs_read_member" on logs for select using (
  exists (select 1 from circle_members
          where circle_id = logs.circle_id and profile_id = auth.uid())
);

create policy "logs_insert_caregiver" on logs for insert with check (
  author_id = auth.uid()
  and exists (select 1 from circle_members
              where circle_id = logs.circle_id
                and profile_id = auth.uid()
                and role in ('caregiver','primary_guardian'))
);

create policy "logs_update_author" on logs for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- emergencies
-- ──────────────────────────────────────────────────────────────
create table emergencies (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  subject_id uuid references care_subjects(id) on delete set null,
  triggered_by uuid not null references profiles(id) on delete set null,
  triggered_at timestamptz not null default now(),
  type emergency_type not null,
  note text,
  status emergency_status not null default 'active',
  acknowledged_by uuid references profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz
);
create index emergencies_circle_status_idx on emergencies (circle_id, status, triggered_at desc);
alter table emergencies enable row level security;

create policy "emergencies_read_member" on emergencies for select using (
  exists (select 1 from circle_members
          where circle_id = emergencies.circle_id and profile_id = auth.uid())
);

create policy "emergencies_insert_caregiver" on emergencies for insert with check (
  triggered_by = auth.uid()
  and exists (select 1 from circle_members
              where circle_id = emergencies.circle_id
                and profile_id = auth.uid()
                and role = 'caregiver')
);

create policy "emergencies_ack_guardian" on emergencies for update using (
  exists (select 1 from circle_members
          where circle_id = emergencies.circle_id
            and profile_id = auth.uid()
            and role in ('guardian','primary_guardian'))
) with check (true);

-- ──────────────────────────────────────────────────────────────
-- invitations
-- ──────────────────────────────────────────────────────────────
create table invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references care_circles(id) on delete cascade,
  code text unique not null,
  role member_role not null,
  created_by uuid references profiles(id) on delete set null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references profiles(id)
);
alter table invitations enable row level security;

create policy "invitations_read_member" on invitations for select using (
  exists (select 1 from circle_members
          where circle_id = invitations.circle_id and profile_id = auth.uid())
);

-- ──────────────────────────────────────────────────────────────
-- push_tokens (FCM)
-- ──────────────────────────────────────────────────────────────
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  updated_at timestamptz default now(),
  unique (profile_id, token)
);
alter table push_tokens enable row level security;

create policy "push_tokens_self" on push_tokens
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- Realtime publication
-- ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table logs;
alter publication supabase_realtime add table emergencies;

-- ──────────────────────────────────────────────────────────────
-- updated_at trigger
-- ──────────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger logs_updated_at before update on logs
  for each row execute function set_updated_at();
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
