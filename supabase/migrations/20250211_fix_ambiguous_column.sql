create or replace function link_member(member_code text)
returns json
language plpgsql
security definer
as $$
declare
  member_record record;
  v_coach_id uuid; -- Renamed to avoid ambiguity
begin
  v_coach_id := auth.uid();

  -- Specialized check for coach role
  if not exists (select 1 from public.users_profile where id = v_coach_id and role = 'coach') then
      return json_build_object('success', false, 'message', '코치만 회원을 등록할 수 있습니다.');
  end if;
  
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
  set coach_id = v_coach_id -- Explicit usage
  where id = member_record.id;

  return json_build_object('success', true, 'message', '회원이 성공적으로 등록되었습니다.', 'member', row_to_json(member_record));
end;
$$;
