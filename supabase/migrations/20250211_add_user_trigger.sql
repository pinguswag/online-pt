-- Trigger to handle new user creation automatically

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_profile (id, nickname, role, code)
  values (
    new.id,
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'role',
    -- Generate 6-char random code if role is member and code is missing
    case 
      when new.raw_user_meta_data->>'role' = 'member' and new.raw_user_meta_data->>'code' is null 
      then upper(substring(md5(random()::text) from 1 for 6))
      else new.raw_user_meta_data->>'code'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
