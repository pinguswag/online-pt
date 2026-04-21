-- Add JSONB columns for advanced tracking in daily_logs
alter table public.daily_logs 
  add column if not exists workouts jsonb default '[]'::jsonb,
  add column if not exists nutrition jsonb default '{}'::jsonb,
  add column if not exists weight numeric(5,2);

