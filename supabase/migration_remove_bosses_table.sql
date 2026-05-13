-- Migration: Remove bosses table and embed boss metadata into boss_weeks
-- Run this in Supabase SQL Editor on existing databases

-- 1. Add new metadata columns to boss_weeks if they don't exist
alter table boss_weeks add column if not exists boss_name text;
alter table boss_weeks add column if not exists boss_emoji text;
alter table boss_weeks add column if not exists boss_subtitle text;
alter table boss_weeks add column if not exists boss_weakness text;
alter table boss_weeks add column if not exists guild_points int default 100;

-- 2. Migrate boss metadata from bosses table into boss_weeks
update boss_weeks bw
set
  boss_name = b.name,
  boss_emoji = b.emoji,
  boss_subtitle = b.subtitle,
  boss_weakness = b.weakness,
  guild_points = b.reward_coins
from bosses b
where bw.boss_id = b.id;

-- 3. Backfill default values for any rows that didn't match
update boss_weeks
set
  boss_name = coalesce(boss_name, 'Дракон Ли'),
  boss_emoji = coalesce(boss_emoji, '🐲'),
  boss_subtitle = coalesce(boss_subtitle, 'Повелитель прокрастинации'),
  boss_weakness = coalesce(boss_weakness, 'activity'),
  guild_points = coalesce(guild_points, 100)
where boss_name is null;

-- 4. Make columns not null now that data is populated
alter table boss_weeks alter column boss_name set not null;
alter table boss_weeks alter column boss_emoji set not null;
alter table boss_weeks alter column boss_weakness set not null;

-- 5. Drop boss_id foreign key and column
alter table boss_weeks drop constraint if exists boss_weeks_boss_id_fkey;
alter table boss_weeks drop column if exists boss_id;

-- Drop boss_damage unique constraint (prevents multiple damage entries per member per day)
alter table boss_damage drop constraint if exists boss_damage_member_date_key;

-- 7. Drop bosses RLS policies
drop policy if exists "bosses_public_read" on bosses;

-- 7. Drop the bosses table
drop table if exists bosses cascade;