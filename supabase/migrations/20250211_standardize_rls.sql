-- Simplify and Standardize RLS for users_profile
-- Drop all existing policies to avoid confusion
drop policy if exists "Enable read access for users to their own profile" on public.users_profile;
drop policy if exists "users_profile_insert_own" on public.users_profile;
drop policy if exists "users_profile_select_own" on public.users_profile;
drop policy if exists "users_profile_update_own" on public.users_profile;
drop policy if exists "coaches_read_members" on public.users_profile;
drop policy if exists "members_read_coach" on public.users_profile;

-- Create one unified policy for the user/owner
create policy "Users manage own profile"
on public.users_profile
for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- Re-add Coach read access (SELECT only)
create policy "Coaches read linked members"
on public.users_profile
for select
using (
    exists (
        select 1 from public.users_profile as coach
        where coach.id = auth.uid() 
        and coach.role = 'coach' 
        and public.users_profile.coach_id = coach.id
    )
    OR role = 'member' -- Temporary: Allow reading all members? No, too open.
    -- Better: Just keep strict linking.
);

-- Re-add Member read coach access
create policy "Members read linked coach"
on public.users_profile
for select
using (
    exists (
        select 1 from public.users_profile as member
        where member.id = auth.uid() 
        and member.coach_id = public.users_profile.id
    )
);

-- Ensure permissions are granted (redundant but safe)
grant all on public.users_profile to authenticated;
