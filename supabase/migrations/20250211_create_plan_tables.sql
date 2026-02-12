-- Create plans table
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references auth.users(id) not null,
  member_id uuid references auth.users(id) not null,
  start_date date not null,
  end_date date not null,
  diet_guide text,
  routine text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create daily_plans table
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) not null,
  date date not null,
  diet_guide text,
  routine text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(member_id, date)
);

-- Enable RLS
alter table public.plans enable row level security;
alter table public.daily_plans enable row level security;

-- Policies for plans
create policy "Users can view their own plans"
  on public.plans for select
  using (auth.uid() = coach_id or auth.uid() = member_id);

create policy "Coaches can create plans"
  on public.plans for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update their plans"
  on public.plans for update
  using (auth.uid() = coach_id);

-- Policies for daily_plans
create policy "Users can view their daily plans"
  on public.daily_plans for select
  using (auth.uid() = member_id or exists (
    select 1 from public.users_profile 
    where id = auth.uid() and role = 'coach' 
    -- Ideally check if coach is linked to member, but for MVP simplifying
  ));

create policy "Coaches can manage daily plans"
  on public.daily_plans for all
  using (exists (
    select 1 from public.users_profile 
    where id = auth.uid() and role = 'coach'
  ));

-- Add index
create index plans_member_id_idx on public.plans(member_id);
create index daily_plans_member_date_idx on public.daily_plans(member_id, date);
