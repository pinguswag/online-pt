-- Ensure users can read their own profile without complex joins first
-- This is critical for the login flow to determine role

drop policy if exists "Enable read access for users to their own profile" on public.users_profile;

create policy "Enable read access for users to their own profile"
on public.users_profile for select
using (auth.uid() = id);

-- Grant access to authenticated users
grant select on public.users_profile to authenticated;
