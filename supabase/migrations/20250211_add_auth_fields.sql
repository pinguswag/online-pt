-- Add role, code, coach_id to users_profile

alter table public.users_profile 
add column if not exists role text check (role in ('coach', 'member')),
add column if not exists code text,
add column if not exists coach_id uuid references public.users_profile(id);

create index if not exists users_profile_code_idx on public.users_profile(code);
