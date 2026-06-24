-- =====================================================
-- BINGEGO UPDATE 3: Watch ads to earn coins
-- Run this in Supabase SQL Editor (one time)
-- =====================================================

-- App settings (key-value) — lets you tune the feature from the admin panel
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('ad_enabled', 'true'),
  ('ad_reward_coins', '10'),
  ('ad_daily_limit', '5')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "settings_read" on public.app_settings;
create policy "settings_read" on public.app_settings for select using (true);

drop policy if exists "admin_write_settings" on public.app_settings;
create policy "admin_write_settings" on public.app_settings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Log of each ad watched (used to enforce the daily limit + history)
create table if not exists public.ad_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coins integer not null,
  created_at timestamptz not null default now()
);

create index if not exists ad_rewards_user_day_idx on public.ad_rewards(user_id, created_at);

alter table public.ad_rewards enable row level security;

drop policy if exists "ad_rewards_select_own" on public.ad_rewards;
create policy "ad_rewards_select_own" on public.ad_rewards for select using (auth.uid() = user_id);
-- inserts happen via the server (service role), which bypasses RLS

-- =====================================================
-- DONE
-- =====================================================
