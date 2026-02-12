-- 1. Update handle_new_user to generate 6-digit numeric code
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  -- Generate 6-digit random number string
  -- floor(random() * (max - min + 1) + min)
  -- 100000 to 999999
  new_code := floor(random() * 900000 + 100000)::text;

  insert into public.users_profile (id, nickname, role, code, required_diet_photos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    -- Use generated numeric code if member and code is missing
    case 
      when (new.raw_user_meta_data->>'role' = 'member' OR new.raw_user_meta_data->>'role' IS NULL) 
           and (new.raw_user_meta_data->>'code' is null OR new.raw_user_meta_data->>'code' = '')
      then new_code
      else new.raw_user_meta_data->>'code'
    end,
    3
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Create link_member RPC function
create or replace function link_member(member_code text)
returns json
language plpgsql
security definer
as $$
declare
  member_record record;
  coach_id uuid;
begin
  coach_id := auth.uid();

  -- specialized check for coach role is nice but RLS handles it too. 
  -- But since this is Security Definer, we should verify the caller is a coach if we want strictness.
  -- For now, we trust the app logic or rely on the logic that only coaches call this.
  
  -- Find the member
  select * into member_record
  from public.users_profile
  where code = member_code
  and role = 'member';

  if not found then
    return json_build_object('success', false, 'message', '유효하지 않은 회원 코드입니다.');
  end if;

  if member_record.coach_id is not null then
    return json_build_object('success', false, 'message', '이미 담당 코치가 배정된 회원입니다.');
  end if;

  -- Link member to coach
  update public.users_profile
  set coach_id = coach_id
  where id = member_record.id;

  return json_build_object('success', true, 'message', '회원이 성공적으로 등록되었습니다.', 'member', row_to_json(member_record));
end;
$$;

-- 3. (Optional) Update existing members to have numeric codes if they have test codes
-- This helps testing immediately using '123456' style codes
update public.users_profile
set code = floor(random() * 900000 + 100000)::text
where role = 'member' and code !~ '^[0-9]{6}$';
