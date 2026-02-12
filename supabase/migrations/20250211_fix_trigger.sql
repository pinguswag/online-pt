-- Improve trigger function for robustness and security
create or replace function public.handle_new_user()
returns trigger
security definer -- Bypass RLS
set search_path = public -- Secure search path
language plpgsql
as $$
begin
  insert into public.users_profile (id, nickname, role, code, required_diet_photos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)), -- Fallback to email prefix
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    -- Generate 6-char random code if role is member and code is missing
    case 
      when (new.raw_user_meta_data->>'role' = 'member' OR new.raw_user_meta_data->>'role' IS NULL) 
           and (new.raw_user_meta_data->>'code' is null OR new.raw_user_meta_data->>'code' = '')
      then upper(substring(md5(random()::text) from 1 for 6))
      else new.raw_user_meta_data->>'code'
    end,
    3 -- Default required diet photos count
  )
  on conflict (id) do nothing; -- Prevent errors if it already succeeded somehow
  return new;
end;
$$;
