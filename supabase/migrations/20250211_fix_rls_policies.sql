-- Ensure users_profile policies are robust
drop policy if exists "users_profile_select_own" on public.users_profile;
drop policy if exists "users_profile_insert_own" on public.users_profile;
drop policy if exists "users_profile_update_own" on public.users_profile;

-- Allow users to read their own profile
create policy "users_profile_select_own"
    on public.users_profile for select
    using (auth.uid() = id);

-- Allow users to insert their own profile (on signup trigger usually, but just in case)
create policy "users_profile_insert_own"
    on public.users_profile for insert
    with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "users_profile_update_own"
    on public.users_profile for update
    using (auth.uid() = id);
    
-- Allow coaches to read members profile
create policy "coaches_read_members"
    on public.users_profile for select
    using (
        exists (
            select 1 from public.users_profile as coach
            where coach.id = auth.uid() 
            and coach.role = 'coach' 
            and public.users_profile.coach_id = coach.id
        )
    );

-- Allow members to read coach profile
create policy "members_read_coach"
    on public.users_profile for select
    using (
        exists (
            select 1 from public.users_profile as member
            where member.id = auth.uid() 
            and member.coach_id = public.users_profile.id
        )
    );
