-- User MVP: users_profile, daily_logs, diet-photos storage
-- Minimal schema for /app flow only

-- 1. users_profile: one row per auth user
create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  required_diet_photos int default 1 not null,
  created_at timestamptz default now()
);

-- 2. daily_logs: one row per user per day
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile(id) on delete cascade,
  log_date date not null,
  diet_photos text[] default '{}',
  workout_checked boolean default false,
  status text default 'pending' not null,
  created_at timestamptz default now(),
  unique(user_id, log_date)
);

-- 3. RLS
alter table public.users_profile enable row level security;
alter table public.daily_logs enable row level security;

-- users_profile: select/insert/update own row only
create policy "users_profile_select_own"
  on public.users_profile for select
  using (auth.uid() = id);

create policy "users_profile_insert_own"
  on public.users_profile for insert
  with check (auth.uid() = id);

create policy "users_profile_update_own"
  on public.users_profile for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- daily_logs: select/insert/update own logs only
create policy "daily_logs_select_own"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "daily_logs_insert_own"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "daily_logs_update_own"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Storage bucket: diet-photos (private)
insert into storage.buckets (id, name, public)
values ('diet-photos', 'diet-photos', false)
on conflict (id) do nothing;

-- Storage policies: authenticated users upload/read own files only
-- Path format: {userId}/{yyyy-mm-dd}/{random}.jpg
create policy "diet_photos_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'diet-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "diet_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'diet-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
