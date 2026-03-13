create table if not exists public.member_consultations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references auth.users(id) not null,
  member_id uuid references auth.users(id) not null,
  
  -- Member Info
  name text,
  registration_date date,
  pt_count integer,
  
  -- Member Goal
  purpose text[], 
  target_weight numeric,
  target_body_fat numeric,
  target_strength text,
  qualitative_goal text,
  
  -- Condition Eval
  injury_area text,
  injury_time text,
  injury_pain boolean,
  injury_pain_intensity integer,
  
  exercise_experience text, 
  exercise_frequency integer,
  
  fitness_squat integer,
  fitness_pushup integer,
  fitness_latpulldown integer,
  
  -- Classification
  member_classification text[],
  classification_reason text,
  
  -- Curriculum Setting
  curriculum_direction text,
  curriculum_difficulty text,
  curriculum_initial_split text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One consultation per coach-member pair
  unique(coach_id, member_id)
);

alter table public.member_consultations enable row level security;

-- Coaches can manage consultations they created
create policy "Coaches can manage their own member consultations"
  on public.member_consultations for all
  using (auth.uid() = coach_id);

-- Members can view their own consultation
create policy "Members can view their own consultations"
  on public.member_consultations for select
  using (auth.uid() = member_id);

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_member_consultations_updated_at on public.member_consultations;
create trigger set_member_consultations_updated_at
  before update on public.member_consultations
  for each row
  execute function public.set_updated_at();
