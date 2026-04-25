-- CareLog Supabase schema (Phase 0)
-- Region: ap-northeast-2 (Seoul)

create extension if not exists pgcrypto;

create type public.user_role as enum ('caregiver', 'guardian');
create type public.meal_status as enum ('completed', 'partial', 'missed');
create type public.medication_status as enum ('completed', 'missed');
create type public.condition_status as enum ('good', 'normal', 'bad');
create type public.issue_type as enum ('none', 'dizziness', 'pain', 'low_appetite', 'other');
create type public.emergency_type as enum ('unconscious', 'fall', 'breathing', 'pain', 'other');
create type public.emergency_status as enum ('active', 'acknowledged', 'resolved');

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    phone text,
    phone_hash text,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.care_circles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    invite_code text unique not null,
    created_by uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.circle_members (
    id uuid primary key default gen_random_uuid(),
    circle_id uuid not null references public.care_circles(id) on delete cascade,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    role public.user_role not null,
    joined_at timestamptz not null default now(),
    unique(circle_id, profile_id)
);

create table if not exists public.logs (
    id uuid primary key default gen_random_uuid(),
    circle_id uuid not null references public.care_circles(id) on delete cascade,
    author_id uuid not null references public.profiles(id) on delete cascade,
    occurred_at timestamptz not null default now(),
    meal public.meal_status not null,
    medication public.medication_status not null,
    condition public.condition_status not null,
    issue public.issue_type not null default 'none',
    note text,
    created_at timestamptz not null default now()
);

create table if not exists public.emergencies (
    id uuid primary key default gen_random_uuid(),
    circle_id uuid not null references public.care_circles(id) on delete cascade,
    triggered_by uuid not null references public.profiles(id) on delete cascade,
    triggered_at timestamptz not null default now(),
    type public.emergency_type not null,
    note text,
    status public.emergency_status not null default 'active',
    acknowledged_by uuid references public.profiles(id),
    acknowledged_at timestamptz,
    resolved_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.fcm_tokens (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    token text not null,
    platform text not null default 'android',
    created_at timestamptz not null default now(),
    unique(profile_id, token)
);

create index if not exists idx_logs_circle_occurred on public.logs(circle_id, occurred_at desc);
create index if not exists idx_emergencies_circle_triggered on public.emergencies(circle_id, triggered_at desc);
create index if not exists idx_members_circle on public.circle_members(circle_id);
create index if not exists idx_members_profile on public.circle_members(profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
  return substr(code, 1, 4) || '-' || substr(code, 5, 4);
end;
$$;

create or replace function public.before_insert_care_circle()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or length(new.invite_code) = 0 then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_circles_updated_at on public.care_circles;
create trigger trg_circles_updated_at
before update on public.care_circles
for each row execute function public.set_updated_at();

drop trigger if exists trg_circles_invite on public.care_circles;
create trigger trg_circles_invite
before insert on public.care_circles
for each row execute function public.before_insert_care_circle();

alter table public.profiles enable row level security;
alter table public.care_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.logs enable row level security;
alter table public.emergencies enable row level security;
alter table public.fcm_tokens enable row level security;

-- profiles
create policy profiles_select_self on public.profiles
for select using (auth.uid() = id);

create policy profiles_insert_self on public.profiles
for insert with check (auth.uid() = id);

create policy profiles_update_self on public.profiles
for update using (auth.uid() = id);

-- helper predicate through circle membership
create policy circles_member_read on public.care_circles
for select using (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = care_circles.id
      and cm.profile_id = auth.uid()
  )
);

create policy circles_create_caregiver on public.care_circles
for insert with check (created_by = auth.uid());

create policy circles_update_creator on public.care_circles
for update using (created_by = auth.uid());

-- membership
create policy members_read_same_circle on public.circle_members
for select using (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = circle_members.circle_id
      and cm.profile_id = auth.uid()
  )
);

create policy members_insert_self_or_creator on public.circle_members
for insert with check (
  profile_id = auth.uid()
  or exists (
    select 1 from public.care_circles c
    where c.id = circle_members.circle_id
      and c.created_by = auth.uid()
  )
);

-- logs
create policy logs_read_circle_member on public.logs
for select using (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = logs.circle_id
      and cm.profile_id = auth.uid()
  )
);

create policy logs_insert_caregiver on public.logs
for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.circle_members cm
    where cm.circle_id = logs.circle_id
      and cm.profile_id = auth.uid()
      and cm.role = 'caregiver'
  )
);

-- emergencies
create policy emergencies_read_circle_member on public.emergencies
for select using (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = emergencies.circle_id
      and cm.profile_id = auth.uid()
  )
);

create policy emergencies_insert_caregiver on public.emergencies
for insert with check (
  triggered_by = auth.uid()
  and exists (
    select 1 from public.circle_members cm
    where cm.circle_id = emergencies.circle_id
      and cm.profile_id = auth.uid()
      and cm.role = 'caregiver'
  )
);

create policy emergencies_ack_guardian on public.emergencies
for update using (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = emergencies.circle_id
      and cm.profile_id = auth.uid()
      and cm.role = 'guardian'
  )
)
with check (
  exists (
    select 1 from public.circle_members cm
    where cm.circle_id = emergencies.circle_id
      and cm.profile_id = auth.uid()
      and cm.role = 'guardian'
  )
);

-- tokens
create policy fcm_select_own on public.fcm_tokens
for select using (profile_id = auth.uid());

create policy fcm_insert_own on public.fcm_tokens
for insert with check (profile_id = auth.uid());

create policy fcm_delete_own on public.fcm_tokens
for delete using (profile_id = auth.uid());

-- Realtime publication
alter publication supabase_realtime add table public.logs;
alter publication supabase_realtime add table public.emergencies;
