-- Retry: Fix Infinite Recursion with CLEAN drops

-- 1. Create Helper Functions (idempotent due to create or replace)
create or replace function public.get_user_role(user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users_profile where id = user_id;
$$;

create or replace function public.get_my_coach_id(user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coach_id from public.users_profile where id = user_id;
$$;

-- 2. Drop OLD policies (Ensure exact names)
drop policy if exists "Coaches read linked members" on public.users_profile;
drop policy if exists "Members read linked coach" on public.users_profile;
drop policy if exists "Users manage own profile" on public.users_profile;
drop policy if exists "enable read access for users to their own profile" on public.users_profile;
drop policy if exists "users_profile_select_own" on public.users_profile;
-- Drop any potential duplicates
drop policy if exists "coaches_read_members" on public.users_profile;
drop policy if exists "members_read_coach" on public.users_profile;

-- 3. Re-create Policies

-- A. Access Own Profile (Read/Write)
create policy "Users manage own profile"
on public.users_profile
for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- B. Coach: Read Linked Members
create policy "Coaches read linked members"
on public.users_profile
for select
using (
    -- Secure check: Am I a coach?
    get_user_role(auth.uid()) = 'coach'
    -- And is this user linked to me?
    and coach_id = auth.uid()
);

-- C. Member: Read Linked Coach
create policy "Members read linked coach"
on public.users_profile
for select
using (
    -- Secure check: Am I a member?
    get_user_role(auth.uid()) = 'member'
    -- And is this user my coach?
    and id = get_my_coach_id(auth.uid())
);
