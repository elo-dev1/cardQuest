-- Run after the base Card Quest schema from SUPABASE_PROMPT.md.

alter table members add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table members add column if not exists member_role text not null default 'parent'
  check (member_role in ('owner','parent','child'));

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  code text not null unique,
  created_by uuid references members(id),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses int default 1,
  uses_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create or replace function my_family_id() returns uuid
  language sql stable
  as $$
    select family_id from members
    where user_id = auth.uid()
    limit 1
  $$;

alter table user_profiles enable row level security;
alter table invitations enable row level security;

drop policy if exists "profile_own" on user_profiles;
create policy "profile_own" on user_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "invitations_owner" on invitations;
create policy "invitations_owner" on invitations for all
  using (
    family_id in (
      select family_id from members
      where user_id = auth.uid() and member_role in ('owner','parent')
    )
  )
  with check (
    family_id in (
      select family_id from members
      where user_id = auth.uid() and member_role in ('owner','parent')
    )
  );

drop policy if exists "invitations_accept" on invitations;
create policy "invitations_accept" on invitations for select
  using (is_active = true and expires_at > now());

create or replace function generate_invite_code() returns text
  language plpgsql as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    select exists(select 1 from invitations where code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function accept_invitation(
  p_code text,
  p_user_id uuid,
  p_name text,
  p_avatar text,
  p_hero_class text
) returns json language plpgsql security definer as $$
declare
  v_invitation invitations%rowtype;
  v_member members%rowtype;
begin
  select * into v_invitation
  from invitations
  where code = upper(p_code)
    and is_active = true
    and expires_at > now()
    and uses_count < max_uses
  for update;

  if not found then
    return json_build_object('error', 'Приглашение недействительно или истекло');
  end if;

  if exists (
    select 1 from members
    where family_id = v_invitation.family_id and user_id = p_user_id
  ) then
    return json_build_object('error', 'Вы уже состоите в этой семье');
  end if;

  insert into members (family_id, user_id, name, role, member_role, avatar, hero_class)
  values (v_invitation.family_id, p_user_id, p_name, 'parent', 'parent', p_avatar, p_hero_class)
  returning * into v_member;

  update invitations set
    uses_count = uses_count + 1,
    used_by = p_user_id,
    used_at = now(),
    is_active = (uses_count + 1 < max_uses)
  where id = v_invitation.id;

  return json_build_object('success', true, 'member', row_to_json(v_member));
end;
$$;
