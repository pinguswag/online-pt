-- Add indexes for common queries to improve performance
-- 1. daily_logs: Frequently queried by member_id and ordered by date
create index if not exists daily_logs_member_id_idx on public.daily_logs (member_id);
create index if not exists daily_logs_log_date_idx on public.daily_logs (log_date);

-- 2. daily_plans: Queried by member_id and date
create index if not exists daily_plans_member_date_idx on public.daily_plans (member_id, date);

-- 3. plans: Queried by member_id (to get current plan) and coach_id
create index if not exists plans_member_id_idx on public.plans (member_id);
create index if not exists plans_coach_id_idx on public.plans (coach_id);

-- 4. users_profile: Queried by coach_id (to list members)
create index if not exists users_profile_coach_id_idx on public.users_profile (coach_id);
create index if not exists users_profile_code_idx on public.users_profile (code);
