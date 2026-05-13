# Card Quest — SQL для Supabase SQL Editor

Перед запуском в Supabase Dashboard включи email-регистрацию:
`Authentication -> Providers -> Email`.

Если нужна регистрация через письмо с подтверждением, включи:
`Authentication -> Providers -> Email -> Confirm email`.

Ниже один полный SQL-скрипт. Его можно целиком вставить в Supabase SQL Editor и выполнить.

```sql
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  coins int default 0,
  crystals int default 0,
  guild_level int default 1,
  guild_xp int default 0,
  guild_xp_next int default 500,
  active_theme text default 'default',
  active_bg text default 'default',
  login_streak int default 0,
  last_login_date date,
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null check (role in ('parent','child')),
  member_role text not null default 'parent' check (member_role in ('owner','parent','child')),
  avatar text not null default '🧙',
  hero_class text not null default 'warrior',
  pin text,
  xp int default 0,
  level int default 1,
  xp_next int default 100,
  total_tasks int default 0,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  created_by uuid references members(id),
  title text not null,
  category text not null,
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  assigned_to text not null default 'all',
  repeat_type text not null default 'daily' check (repeat_type in ('daily','weekly','once')),
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  date date not null,
  completed_at timestamptz default now(),
  unique(task_id, member_id, date)
);

create table if not exists rewards_awarded (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  date date not null,
  xp_given int default 0,
  coins_given int default 0,
  unique(task_id, member_id, date)
);

create table if not exists cards (
  id text primary key,
  name text not null,
  emoji text not null,
  category text not null,
  rarity text not null check (rarity in ('common','uncommon','rare','epic','legendary')),
  attack int default 10,
  defense int default 0,
  ability text,
  ability_type text,
  flavor_text text,
  is_foil boolean default false,
  created_at timestamptz default now()
);

create table if not exists collection (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  card_id text references cards(id),
  count int default 1,
  obtained_at timestamptz default now(),
  unique(family_id, card_id)
);

create table if not exists packs_history (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  member_id uuid references members(id),
  pack_type text not null,
  cards_got text[] not null,
  pity_count int default 0,
  opened_at timestamptz default now()
);

create table if not exists pity_counters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  packs_since_rare int default 0,
  packs_since_epic int default 0,
  packs_since_legendary int default 0,
  unique(family_id)
);

create table if not exists boss_weeks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  boss_name text not null,
  boss_emoji text not null,
  boss_subtitle text,
  boss_weakness text not null,
  week_start date not null,
  week_end date not null,
  boss_hp_max int not null,
  boss_hp_cur int not null,
  is_won boolean default false,
  is_active boolean default true,
  guild_points int default 100,
  created_at timestamptz default now(),
  unique(family_id, week_start)
);

create table if not exists boss_damage (
  id uuid primary key default gen_random_uuid(),
  boss_week_id uuid references boss_weeks(id) on delete cascade,
  member_id uuid references members(id),
  damage int not null,
  date date not null,
  created_at timestamptz default now()
);

create table if not exists battle_deck (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  card_id text references cards(id),
  slot int check (slot between 1 and 4),
  unique(family_id, slot)
);

create table if not exists shop_purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  item_id text not null,
  item_type text not null,
  price_paid int not null,
  currency text default 'coins',
  purchased_at timestamptz default now()
);

create table if not exists achievements_unlocked (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  member_id uuid references members(id),
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  unique(family_id, achievement_id)
);

create table if not exists quest_progress (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  quest_id text not null,
  week_start date not null,
  progress int default 0,
  is_complete boolean default false,
  claimed boolean default false,
  unique(family_id, quest_id, week_start)
);

create table if not exists wheel_spins (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  member_id uuid references members(id),
  last_spin date,
  result_type text,
  result_value int,
  unique(family_id, member_id)
);

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

create table if not exists card_exchanges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  initiator_id uuid references members(id),
  recipient_id uuid references members(id),
  offered_card_id text references cards(id),
  requested_card_id text references cards(id),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists member_collections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  card_id text references cards(id),
  count int default 1,
  stars int default 0,
  is_new boolean default false,
  obtained_at timestamptz default now(),
  unique(member_id, card_id)
);

create table if not exists member_exchange_limits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  date date not null,
  exchanges_count int default 0,
  unique(member_id, date)
);

-- Safe upgrades for existing projects.
alter table families add column if not exists crystals int default 0;
alter table families add column if not exists guild_xp_next int default 500;
alter table families add column if not exists active_theme text default 'default';
alter table families add column if not exists active_bg text default 'default';
alter table families add column if not exists login_streak int default 0;
alter table families add column if not exists last_login_date date;
alter table members add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table members add column if not exists member_role text not null default 'parent';
alter table members add column if not exists xp_next int default 100;
alter table members add column if not exists total_tasks int default 0;

-- ─────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────

create or replace function public.is_family_owner(p_family_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from families
      where id = p_family_id and owner_id = auth.uid()
    )
  $$;

create or replace function public.is_family_member(p_family_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from families
      where id = p_family_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from members
      where family_id = p_family_id and user_id = auth.uid()
    )
  $$;

create or replace function public.is_family_adult(p_family_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from families
      where id = p_family_id and owner_id = auth.uid()
    )
    or exists (
      select 1 from members
      where family_id = p_family_id
        and user_id = auth.uid()
        and member_role in ('owner','parent')
    )
  $$;

create or replace function public.my_family_id() returns uuid
  language sql stable security definer set search_path = public as $$
    select family_id from members
    where user_id = auth.uid()
    order by created_at
    limit 1
  $$;

create or replace function public.generate_invite_code() returns text
  language plpgsql security definer set search_path = public as $$
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

create or replace function public.accept_invitation(
  p_code text,
  p_user_id uuid,
  p_name text,
  p_avatar text,
  p_hero_class text
) returns json
  language plpgsql security definer set search_path = public as $$
declare
  v_invitation invitations%rowtype;
  v_member members%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return json_build_object('error', 'Нужно войти под своим аккаунтом');
  end if;

  select * into v_invitation
  from invitations
  where code = upper(trim(p_code))
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

  if exists (
    select 1 from members
    where user_id = p_user_id and family_id <> v_invitation.family_id
  ) then
    return json_build_object('error', 'Вы уже состоите в другой гильдии');
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

create or replace function public.handle_new_user_profile() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_card_quest on auth.users;
create trigger on_auth_user_created_card_quest
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────

alter table families enable row level security;
alter table members enable row level security;
alter table tasks enable row level security;
alter table completions enable row level security;
alter table rewards_awarded enable row level security;
alter table cards enable row level security;
alter table collection enable row level security;
alter table packs_history enable row level security;
alter table pity_counters enable row level security;

alter table boss_weeks enable row level security;
alter table boss_damage enable row level security;
alter table battle_deck enable row level security;
alter table shop_purchases enable row level security;
alter table achievements_unlocked enable row level security;
alter table quest_progress enable row level security;
alter table wheel_spins enable row level security;
alter table user_profiles enable row level security;
alter table invitations enable row level security;

drop policy if exists "cards_public_read" on cards;
create policy "cards_public_read" on cards for select using (true);




drop policy if exists "profile_own" on user_profiles;
create policy "profile_own" on user_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "families_owner" on families;
drop policy if exists "families_members" on families;
drop policy if exists "families_owner_write" on families;
drop policy if exists "families_owner_update" on families;
drop policy if exists "families_owner_delete" on families;
create policy "families_members" on families for select
  using (
    owner_id = auth.uid()
    or public.is_family_member(id)
    or exists (
      select 1 from invitations
      where invitations.family_id = families.id
        and invitations.is_active = true
        and invitations.expires_at > now()
        and invitations.uses_count < invitations.max_uses
    )
  );
create policy "families_owner_write" on families for insert
  with check (owner_id = auth.uid());
create policy "families_owner_update" on families for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "families_owner_delete" on families for delete
  using (owner_id = auth.uid());

drop policy if exists "members_policy" on members;
drop policy if exists "members_read" on members;
drop policy if exists "members_write" on members;
drop policy if exists "members_update_own" on members;
drop policy if exists "members_delete" on members;
create policy "members_read" on members for select
  using (public.is_family_member(family_id));
create policy "members_write" on members for insert
  with check (
    public.is_family_owner(family_id)
    or public.is_family_adult(family_id)
  );
create policy "members_update_own" on members for update
  using (
    user_id = auth.uid()
    or public.is_family_owner(family_id)
    or (member_role = 'child' and public.is_family_adult(family_id))
  )
  with check (
    user_id = auth.uid()
    or public.is_family_owner(family_id)
    or (member_role = 'child' and public.is_family_adult(family_id))
  );
create policy "members_delete" on members for delete
  using (
    public.is_family_owner(family_id)
    or (member_role = 'child' and public.is_family_adult(family_id))
    or (user_id = auth.uid() and member_role = 'parent')
  );

drop policy if exists "tasks_policy" on tasks;
create policy "tasks_policy" on tasks for all
  using (public.is_family_member(family_id))
  with check (public.is_family_adult(family_id));

drop policy if exists "collection_policy" on collection;
create policy "collection_policy" on collection for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "packs_policy" on packs_history;
create policy "packs_policy" on packs_history for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "pity_policy" on pity_counters;
create policy "pity_policy" on pity_counters for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "boss_weeks_policy" on boss_weeks;
create policy "boss_weeks_policy" on boss_weeks for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "battle_deck_policy" on battle_deck;
create policy "battle_deck_policy" on battle_deck for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "shop_policy" on shop_purchases;
create policy "shop_policy" on shop_purchases for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "ach_policy" on achievements_unlocked;
create policy "ach_policy" on achievements_unlocked for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "quest_policy" on quest_progress;
create policy "quest_policy" on quest_progress for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "wheel_policy" on wheel_spins;
create policy "wheel_policy" on wheel_spins for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "completions_policy" on completions;
create policy "completions_policy" on completions for all
  using (
    exists (
      select 1 from tasks
      where tasks.id = completions.task_id
        and public.is_family_member(tasks.family_id)
    )
  )
  with check (
    exists (
      select 1 from tasks
      where tasks.id = completions.task_id
        and public.is_family_member(tasks.family_id)
    )
  );

drop policy if exists "rewards_policy" on rewards_awarded;
create policy "rewards_policy" on rewards_awarded for all
  using (
    exists (
      select 1 from tasks
      where tasks.id = rewards_awarded.task_id
        and public.is_family_member(tasks.family_id)
    )
  )
  with check (
    exists (
      select 1 from tasks
      where tasks.id = rewards_awarded.task_id
        and public.is_family_member(tasks.family_id)
    )
  );

drop policy if exists "boss_damage_policy" on boss_damage;
create policy "boss_damage_policy" on boss_damage for all
  using (
    exists (
      select 1 from boss_weeks
      where boss_weeks.id = boss_damage.boss_week_id
        and public.is_family_member(boss_weeks.family_id)
    )
  )
  with check (
    exists (
      select 1 from boss_weeks
      where boss_weeks.id = boss_damage.boss_week_id
        and public.is_family_member(boss_weeks.family_id)
    )
  );

drop policy if exists "invitations_owner" on invitations;
drop policy if exists "invitations_accept" on invitations;
create policy "invitations_accept" on invitations for select
  using (
    (is_active = true and expires_at > now() and uses_count < max_uses)
    or public.is_family_adult(family_id)
  );
create policy "invitations_owner" on invitations for all
  using (public.is_family_adult(family_id))
  with check (public.is_family_adult(family_id));

alter table card_exchanges enable row level security;
alter table exchange_limits enable row level security;

drop policy if exists "card_exchanges_policy" on card_exchanges;
create policy "card_exchanges_policy" on card_exchanges for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop table if exists exchange_limits;

alter table member_collections enable row level security;
alter table member_exchange_limits enable row level security;

drop policy if exists "member_collections_policy" on member_collections;
create policy "member_collections_policy" on member_collections for all
  using (
    exists (
      select 1 from members
      where members.id = member_collections.member_id
        and public.is_family_member(members.family_id)
    )
  )
  with check (
    exists (
      select 1 from members
      where members.id = member_collections.member_id
        and public.is_family_member(members.family_id)
    )
  );

drop policy if exists "member_exchange_limits_policy" on member_exchange_limits;
create policy "member_exchange_limits_policy" on member_exchange_limits for all
  using (
    exists (
      select 1 from members
      where members.id = member_exchange_limits.member_id
        and public.is_family_member(members.family_id)
    )
  )
  with check (
    exists (
      select 1 from members
      where members.id = member_exchange_limits.member_id
        and public.is_family_member(members.family_id)
    )
  );

-- ─────────────────────────────────────────────
-- Seed cards used by the app
-- ─────────────────────────────────────────────

insert into cards (id, name, emoji, category, rarity, attack, defense, ability, flavor_text) values
('c001','Ранний подъём','⏰','health','common',10,0,null,'Начинает день до того, как сон успел договориться.'),
('c002','Спорт','🏋️','activity','common',15,0,null,'Сила маленьких повторений, собранная в один уверенный удар.'),
('c003','Чтение','📖','study','uncommon',20,5,'Задачи учёбы +10% XP','Каждая страница открывает короткий путь через туман.'),
('c004','Сосредоточенность','🎯','study','uncommon',18,8,null,'Когда шум отступает, даже сложная цель выглядит ближе.'),
('c005','Помощь','🤝','care','rare',25,15,'Командный урон +20%','Карточка, которая напоминает: вместе урон всегда выше.'),
('c006','Чистота','🧹','home','common',12,0,null,'Убирает хаос с поля и с письменного стола.'),
('c007','Творчество','🎨','special','epic',45,20,'Все карты этого хода x1.5','Не спрашивает, можно ли. Просто рисует новую дверь.'),
('c008','Здоровое питание','🍎','health','rare',30,10,'Задачи здоровья +2x урон','Сладкий критический удар по усталости.'),
('c009','Настойчивость','🏔️','special','legendary',85,30,'Игнорирует защиту босса','Поднимается выше облаков, но не выше семейного расписания.'),
('c010','Тёплый завтрак','🥣','health','common',11,3,null,'Мягкий старт для большого дня.'),
('c011','Быстрые шаги','👟','activity','common',14,2,null,'Дистанция складывается из шагов.'),
('c012','Домашний рыцарь','🧽','home','uncommon',18,10,'Домашние задачи +5 защиты','Щит из губки и ведра.'),
('c013','Заметки мага','📝','study','common',12,4,null,'Короткая запись сильнее длинного забывания.'),
('c014','Обнимательный щит','🫶','care','rare',20,22,'Снижает урон босса','Иногда защита выглядит очень просто.'),
('c015','Семейный марш','🥁','activity','uncommon',22,6,'Активность +10% урон','Ритм, под который легче выйти на улицу.'),
('c016','Звёздная вода','💦','health','rare',28,12,'Восстанавливает 10 энергии','Восемь стаканов, один блеск.'),
('c017','Секретный конспект','📚','study','epic',42,18,'Следующая учебная задача x2 XP','Пахнет карандашом и победой.'),
('c018','Уютный порядок','🛋️','home','common',13,5,null,'Место, где наконец видно пол.'),
('c019','Доброе слово','💬','care','common',9,9,null,'Маленькая фраза с большим радиусом.'),
('c020','Лунная зарядка','🌙','activity','rare',31,7,'Вечерние задачи +15% XP','Даже поздно можно сделать чуть-чуть.'),
('c021','Фокус-лампа','💡','study','uncommon',19,11,null,'Светит прямо на сложный абзац.'),
('c022','Золотая тряпка','✨','home','epic',39,26,'Уборка даёт +20 монет','Редкий артефакт внезапной мотивации.'),
('c023','Сердце гильдии','💖','care','legendary',75,45,'Вся семья получает +25 XP','Не бьёт первой, но побеждает последней.'),
('c024','Сонный договор','🛌','health','uncommon',16,18,'Защита от усталости','Подписывается до 23:00.'),
('c025','Пикник следопыта','🧺','activity','common',15,4,null,'Полчаса прогулки превращает карту в праздник.'),
('c026','Башня знаний','🏛️','study','rare',34,16,'Крит по учебным боссам','Строится по кирпичику.'),
('c027','Мастер ужина','🍳','home','uncommon',21,8,'Помощь с ужином +10 монет','Вкусная карта поддержки.'),
('c028','Весточка бабушке','☎️','care','rare',26,19,'Недельный квест +15%','Звонок, который делает день теплее.'),
('c029','Щит привычки','🛡️','special','epic',35,35,'Стрик защищён один день','Для дней, когда жизнь немного шумит.'),
('c030','Комета порядка','☄️','special','legendary',90,25,'Три случайные задачи дают x2 награду','Появляется редко, зато наводит порядок быстро.')
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  category = excluded.category,
  rarity = excluded.rarity,
  attack = excluded.attack,
  defense = excluded.defense,
  ability = excluded.ability,
  flavor_text = excluded.flavor_text;


```
