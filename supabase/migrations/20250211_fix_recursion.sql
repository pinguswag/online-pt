-- Fix Infinite Recursion by using a Security Definer function
-- This allows checking the user's role without triggering RLS recursively

create or replace function public.get_user_role(user_id uuid)
returns text
language sql
security definer -- Bypass RLS
set search_path = public
stable
as $$
  select role from public.users_profile where id = user_id;
$$;

-- Drop problematic policies
drop policy if exists "Coaches read linked members" on public.users_profile;
drop policy if exists "Members read linked coach" on public.users_profile;
drop policy if exists "Users manage own profile" on public.users_profile;

-- Re-create policies using the helper function

-- 1. Users can manage their own profile (Unified)
create policy "Users manage own profile"
on public.users_profile
for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- 2. Coaches can read linked members
-- check if current user is coach via helper (no recursion)
create policy "Coaches read linked members"
on public.users_profile
for select
using (
    get_user_role(auth.uid()) = 'coach'
    and coach_id = auth.uid()
);

-- 3. Members can read their linked coach
-- check if current user is member via helper (no recursion)
create policy "Members read linked coach"
on public.users_profile
for select
using (
    get_user_role(auth.uid()) = 'member'
    and id = (select coach_id from public.users_profile where id = auth.uid()) 
    -- Wait, looking up 'my coach_id' might still recurse if we select from users_profile?
    -- 'where id = auth.uid()' matches "Users manage own profile", so that's fine? 
    -- NO. 'select coach_id from public.users_profile' triggers RLS.
    
    -- Let's use a 2nd helper or just trust that accessing OWN row is handled by policy #1.
    -- Actually, if Policy #1 allows reading own row, we can just do:
    -- coach_id matches the target ID.
);

-- Refined Policy 3:
-- Just simply: Target is my coach.
-- But how do I know "my coach" without querying myself?
-- using ( id = get_my_coach_id(auth.uid()) )

create or replace function public.get_my_coach_id(user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coach_id from public.users_profile where id = user_id;
$$;

create policy "Members read linked coach"
on public.users_profile
for select
using (
    get_user_role(auth.uid()) = 'member'
    and id = get_my_coach_id(auth.uid())
);
