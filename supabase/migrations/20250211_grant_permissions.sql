-- Grant necessary table permissions to authenticated users
-- RLS policies control 'which' rows, but these grants control 'what' operations are allowed

grant insert, update, delete on public.users_profile to authenticated;
grant insert, update, delete on public.plans to authenticated;
grant insert, update, delete on public.daily_plans to authenticated;
grant insert, update, delete on public.daily_logs to authenticated;

-- Also ensure sequences are usable if any (UUIDs don't use sequences typically but good practice)
grant usage, select on all sequences in schema public to authenticated;
