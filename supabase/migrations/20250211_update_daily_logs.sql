-- Add missing columns to daily_logs
alter table public.daily_logs 
  add column if not exists memoir text,
  add column if not exists feedback text,
  add column if not exists score integer;

-- Rename columns to match conventions if needed, or keep and map in code
-- Renaming workout_checked to routine_checked for consistency with frontend interface
alter table public.daily_logs rename column workout_checked to routine_checked;

-- Check if user_id should be member_id (to match plans table)
alter table public.daily_logs rename column user_id to member_id;

-- Ensure RLS allows basic access (assuming policies exist from previous migration, but reinforcing)
drop policy if exists "Users can view own logs" on public.daily_logs;
create policy "Users can view own logs"
  on public.daily_logs for select
  using (auth.uid() = member_id or exists (
    select 1 from public.users_profile 
    where id = auth.uid() and role = 'coach'
  ));

drop policy if exists "Users can update own logs" on public.daily_logs;
create policy "Users can update own logs"
  on public.daily_logs for update
  using (auth.uid() = member_id);

drop policy if exists "Users can insert own logs" on public.daily_logs;
create policy "Users can insert own logs"
  on public.daily_logs for insert
  with check (auth.uid() = member_id);

drop policy if exists "Coaches can update logs (feedback)" on public.daily_logs;
create policy "Coaches can update logs (feedback)"
  on public.daily_logs for update
  using (exists (
    select 1 from public.users_profile 
    where id = auth.uid() and role = 'coach'
  ));
