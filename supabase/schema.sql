-- =====================================================
-- DRAMAFLASH DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =============== EXTENSIONS ===============
create extension if not exists "uuid-ossp";

-- =============== PROFILES ===============
-- Extends auth.users with app-specific fields
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  coins integer not null default 0,
  is_vip boolean not null default false,
  vip_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email,'@',1));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============== SERIES (Dramas) ===============
create table public.series (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  cover_url text,
  vertical_cover_url text,
  category text,
  tags text[] default '{}',
  total_episodes integer not null default 0,
  free_episodes integer not null default 2,
  coin_price integer not null default 30,
  is_published boolean not null default false,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index series_published_idx on public.series(is_published, created_at desc);
create index series_category_idx on public.series(category) where is_published = true;

-- =============== EPISODES ===============
create table public.episodes (
  id uuid primary key default uuid_generate_v4(),
  series_id uuid not null references public.series(id) on delete cascade,
  episode_number integer not null,
  title text,
  description text,
  video_url text not null,
  thumbnail_url text,
  duration_seconds integer,
  is_free boolean not null default false,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (series_id, episode_number)
);

create index episodes_series_idx on public.episodes(series_id, episode_number);

-- =============== UNLOCKS (records of users unlocking episodes) ===============
create table public.unlocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  method text not null check (method in ('coin','vip','ad','free')),
  coins_spent integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create index unlocks_user_idx on public.unlocks(user_id);

-- =============== TRANSACTIONS (coin purchases / subscriptions) ===============
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('coin_pack','subscription','refund')),
  amount_usd numeric(10,2) not null,
  coins_added integer not null default 0,
  vip_days_added integer not null default 0,
  stripe_session_id text,
  stripe_payment_intent text,
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index tx_user_idx on public.transactions(user_id, created_at desc);
create unique index tx_stripe_session_idx on public.transactions(stripe_session_id) where stripe_session_id is not null;

-- =============== USER LIKES / FAVORITES ===============
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

create table public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  progress_seconds integer not null default 0,
  watched_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create index watch_history_user_idx on public.watch_history(user_id, watched_at desc);

-- =============== COIN PACKS / SUBSCRIPTION PLANS ===============
create table public.coin_packs (
  id text primary key,
  coins integer not null,
  bonus_coins integer not null default 0,
  price_usd numeric(10,2) not null,
  stripe_price_id text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  label text
);

insert into public.coin_packs (id, coins, bonus_coins, price_usd, display_order, label) values
  ('pack_60',    60,    0,    0.99, 1, null),
  ('pack_300',   300,   10,   4.99, 2, null),
  ('pack_600',   600,   60,   9.99, 3, 'Most Popular'),
  ('pack_1200',  1200,  200,  19.99,4, null),
  ('pack_3000',  3000,  600,  49.99,5, null),
  ('pack_6000',  6000,  1500, 99.99,6, 'Best Value')
on conflict (id) do nothing;

create table public.subscription_plans (
  id text primary key,
  name text not null,
  duration_days integer not null,
  coins_included integer not null default 0,
  price_usd numeric(10,2) not null,
  stripe_price_id text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false
);

insert into public.subscription_plans (id, name, duration_days, coins_included, price_usd, display_order, is_featured) values
  ('sub_week',  'Weekly VIP',  7,    0,    4.99,  1, false),
  ('sub_month', 'Monthly VIP', 30,   500,  9.99,  2, true),
  ('sub_year',  'Yearly VIP',  365,  6000, 59.99, 3, false)
on conflict (id) do nothing;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.unlocks enable row level security;
alter table public.transactions enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;
alter table public.coin_packs enable row level security;
alter table public.subscription_plans enable row level security;

-- Profiles: users can read all, but only update their own
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Series: anyone can read published series; only admins write (via service role)
create policy "series_select_published" on public.series for select using (is_published = true);

-- Episodes: anyone can read; the video URL is checked at API layer
create policy "episodes_select" on public.episodes for select using (true);

-- Unlocks: users see only their own
create policy "unlocks_select_own" on public.unlocks for select using (auth.uid() = user_id);
create policy "unlocks_insert_own" on public.unlocks for insert with check (auth.uid() = user_id);

-- Transactions: users see only their own (writes are via service role from webhooks)
create policy "tx_select_own" on public.transactions for select using (auth.uid() = user_id);

-- Favorites
create policy "fav_select_own" on public.favorites for select using (auth.uid() = user_id);
create policy "fav_insert_own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "fav_delete_own" on public.favorites for delete using (auth.uid() = user_id);

-- Watch history
create policy "watch_select_own" on public.watch_history for select using (auth.uid() = user_id);
create policy "watch_upsert_own" on public.watch_history for insert with check (auth.uid() = user_id);
create policy "watch_update_own" on public.watch_history for update using (auth.uid() = user_id);

-- Coin packs / plans: anyone can read
create policy "packs_select" on public.coin_packs for select using (is_active = true);
create policy "plans_select" on public.subscription_plans for select using (is_active = true);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- After running this, also create these via SQL or Supabase UI:
insert into storage.buckets (id, name, public) values ('videos', 'videos', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;

-- Public read on covers
create policy "covers_public_read"
on storage.objects for select
using (bucket_id = 'covers');

-- Videos: only authenticated users via signed URL (we sign in API)
create policy "videos_authenticated_read"
on storage.objects for select to authenticated
using (bucket_id = 'videos');

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================
create or replace view public.series_with_stats as
select
  s.*,
  (select count(*) from public.episodes e where e.series_id = s.id) as actual_episodes
from public.series s;

-- =====================================================
-- DONE
-- =====================================================
