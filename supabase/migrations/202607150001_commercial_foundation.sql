-- Commercial foundation migration for DramaFlash.
-- This migration is additive: existing users, series, episodes, unlocks and
-- transactions remain valid while the application moves to the new model.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Existing content compatibility
-- ---------------------------------------------------------------------------

alter table public.series add column if not exists slug text;
alter table public.series add column if not exists original_language text not null default 'en';
alter table public.series add column if not exists status text not null default 'DRAFT';
alter table public.series add column if not exists published_at timestamptz;
alter table public.series add column if not exists age_rating text;
alter table public.series add column if not exists season_price integer;
alter table public.series add column if not exists search_document tsvector;

update public.series
set status = case when is_published then 'PUBLISHED' else 'DRAFT' end
where status = 'DRAFT';

create unique index if not exists series_slug_unique_idx
  on public.series(slug) where slug is not null;
create index if not exists series_status_published_idx
  on public.series(status, published_at desc);
create index if not exists series_search_idx
  on public.series using gin(search_document);

alter table public.episodes add column if not exists slug text;
alter table public.episodes add column if not exists status text not null default 'DRAFT';
alter table public.episodes add column if not exists aspect_ratio text not null default '9:16';
alter table public.episodes add column if not exists published_at timestamptz;
alter table public.episodes add column if not exists updated_at timestamptz not null default now();

update public.episodes
set status = case
  when exists (
    select 1 from public.series s
    where s.id = episodes.series_id and s.is_published = true
  ) then 'PUBLISHED'
  else 'DRAFT'
end
where status = 'DRAFT';

alter table public.episodes drop constraint if exists episodes_aspect_ratio_check;
alter table public.episodes add constraint episodes_aspect_ratio_check
  check (aspect_ratio in ('9:16', '16:9', '1:1', 'OTHER'));

create unique index if not exists episodes_series_slug_unique_idx
  on public.episodes(series_id, slug) where slug is not null;
create index if not exists episodes_status_idx
  on public.episodes(series_id, status, episode_number);

-- ---------------------------------------------------------------------------
-- Catalog and translations
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name_key text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (slug, name_key, display_order) values
  ('romance', 'category.romance', 10),
  ('billionaire', 'category.billionaire', 20),
  ('comedy', 'category.comedy', 30),
  ('revenge', 'category.revenge', 40),
  ('mafia', 'category.mafia', 50),
  ('fantasy', 'category.fantasy', 60),
  ('werewolf', 'category.werewolf', 70),
  ('family', 'category.family', 80),
  ('christian', 'category.christian', 90),
  ('drama', 'category.drama', 100)
on conflict (slug) do update set
  name_key = excluded.name_key,
  display_order = excluded.display_order;

create table if not exists public.series_categories (
  series_id uuid not null references public.series(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (series_id, category_id)
);

create table if not exists public.series_translations (
  id uuid primary key default uuid_generate_v4(),
  series_id uuid not null references public.series(id) on delete cascade,
  language text not null,
  title text not null,
  description text,
  short_description text,
  tags text[] not null default '{}',
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, language)
);

create index if not exists series_translations_language_idx
  on public.series_translations(language, series_id);

create table if not exists public.episode_translations (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  language text not null,
  title text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, language)
);

-- ---------------------------------------------------------------------------
-- Cloudflare Stream-ready media model
-- ---------------------------------------------------------------------------

create table if not exists public.video_assets (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  source_asset_id uuid references public.video_assets(id) on delete set null,
  provider text not null default 'CLOUDFLARE_STREAM',
  provider_asset_id text,
  playback_id text,
  language text not null default 'en',
  type text not null default 'FULL_VIDEO',
  status text not null default 'PENDING_UPLOAD',
  aspect_ratio text not null default '9:16',
  width integer,
  height integer,
  duration_seconds numeric(12,3),
  thumbnail_url text,
  preview_url text,
  signed_playback_required boolean not null default true,
  processing_error text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_assets_type_check
    check (type in ('FULL_VIDEO', 'AUDIO_ONLY', 'SUBTITLE_ONLY')),
  constraint video_assets_status_check
    check (status in ('PENDING_UPLOAD', 'UPLOADING', 'PROCESSING', 'READY', 'ERROR', 'ARCHIVED')),
  constraint video_assets_aspect_ratio_check
    check (aspect_ratio in ('9:16', '16:9', '1:1', 'OTHER')),
  unique (provider, provider_asset_id)
);

create index if not exists video_assets_episode_language_idx
  on public.video_assets(episode_id, language, type, status);

create table if not exists public.audio_tracks (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  video_asset_id uuid references public.video_assets(id) on delete cascade,
  language text not null,
  label text,
  url text,
  is_default boolean not null default false,
  status text not null default 'READY',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, language)
);

alter table public.subtitles add column if not exists video_asset_id uuid
  references public.video_assets(id) on delete set null;
alter table public.subtitles add column if not exists format text not null default 'VTT';
alter table public.subtitles add column if not exists status text not null default 'READY';
alter table public.subtitles add column if not exists metadata jsonb not null default '{}';

-- ---------------------------------------------------------------------------
-- Engagement and playback analytics
-- ---------------------------------------------------------------------------

create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid not null references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'PUBLISHED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_series_created_idx
  on public.comments(series_id, created_at desc) where status = 'PUBLISHED';

create table if not exists public.playback_events (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  series_id uuid not null references public.series(id) on delete cascade,
  episode_id uuid not null references public.episodes(id) on delete cascade,
  video_asset_id uuid references public.video_assets(id) on delete set null,
  event_type text not null,
  position_seconds numeric(12,3),
  duration_seconds numeric(12,3),
  session_id text not null,
  country text,
  language text,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create index if not exists playback_events_episode_time_idx
  on public.playback_events(episode_id, occurred_at desc);
create index if not exists playback_events_user_time_idx
  on public.playback_events(user_id, occurred_at desc) where user_id is not null;

create table if not exists public.daily_content_stats (
  stat_date date not null,
  series_id uuid not null references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  plays bigint not null default 0,
  unique_viewers bigint not null default 0,
  completed_plays bigint not null default 0,
  watch_seconds bigint not null default 0,
  revenue_usd numeric(14,2) not null default 0,
  primary key (stat_date, series_id, episode_id)
);

create table if not exists public.content_placements (
  id uuid primary key default uuid_generate_v4(),
  placement text not null,
  series_id uuid not null references public.series(id) on delete cascade,
  country text not null default '*',
  language text not null default '*',
  display_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement, series_id, country, language)
);

create index if not exists content_placements_lookup_idx
  on public.content_placements(placement, country, language, is_active, display_order);

-- ---------------------------------------------------------------------------
-- Commerce: immutable orders, entitlements and wallet ledger
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'STRIPE',
  provider_order_id text,
  status text not null default 'PENDING',
  currency text not null default 'USD',
  subtotal_amount integer not null default 0,
  discount_amount integer not null default 0,
  total_amount integer not null default 0,
  country text,
  idempotency_key text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (provider, provider_order_id)
);

create index if not exists orders_user_created_idx
  on public.orders(user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  title text not null,
  quantity integer not null default 1,
  unit_amount integer not null,
  total_amount integer not null,
  metadata jsonb not null default '{}'
);

create table if not exists public.purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  series_id uuid not null references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  purchase_type text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists purchases_episode_unique_idx
  on public.purchases(user_id, episode_id)
  where purchase_type = 'EPISODE' and episode_id is not null;
create unique index if not exists purchases_season_unique_idx
  on public.purchases(user_id, series_id)
  where purchase_type = 'SEASON';

create table if not exists public.vip_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  provider_subscription_id text unique,
  plan_id text references public.subscription_plans(id) on delete set null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vip_subscriptions_user_idx
  on public.vip_subscriptions(user_id, status, current_period_end desc);

create table if not exists public.wallet_ledger (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  entry_type text not null,
  reference_type text,
  reference_id text,
  idempotency_key text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists wallet_ledger_user_created_idx
  on public.wallet_ledger(user_id, created_at desc);

create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text not null,
  discount_value integer not null,
  currency text,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (coupon_id, user_id, order_id)
);

-- ---------------------------------------------------------------------------
-- Webhook idempotency and future AI workflows
-- ---------------------------------------------------------------------------

create table if not exists public.webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  status text not null default 'RECEIVED',
  payload jsonb not null default '{}',
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (provider, event_id)
);

create table if not exists public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  job_type text not null,
  status text not null default 'QUEUED',
  series_id uuid references public.series(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  source_language text,
  target_language text,
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  provider text,
  provider_job_id text,
  error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists ai_jobs_status_created_idx
  on public.ai_jobs(status, created_at);

-- ---------------------------------------------------------------------------
-- Transaction-safe wallet operation
-- ---------------------------------------------------------------------------

create or replace function public.unlock_episode_with_coins(
  p_episode_id uuid,
  p_idempotency_key text
)
returns table (success boolean, balance integer, coins_spent integer, already_unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_price integer;
  v_free boolean;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select p.coins into v_balance
  from public.profiles p
  where p.id = v_user_id
  for update;

  if v_balance is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.unlocks u
    where u.user_id = v_user_id and u.episode_id = p_episode_id
  ) then
    return query select true, v_balance, 0, true;
    return;
  end if;

  select s.coin_price,
         (e.is_free or e.episode_number <= s.free_episodes)
  into v_price, v_free
  from public.episodes e
  join public.series s on s.id = e.series_id
  where e.id = p_episode_id;

  if v_price is null then
    raise exception 'EPISODE_NOT_FOUND';
  end if;

  if v_free then
    return query select true, v_balance, 0, true;
    return;
  end if;

  if v_balance < v_price then
    return query select false, v_balance, v_price, false;
    return;
  end if;

  update public.profiles
  set coins = coins - v_price
  where id = v_user_id
  returning coins into v_balance;

  insert into public.unlocks (user_id, episode_id, method, coins_spent)
  values (v_user_id, p_episode_id, 'coin', v_price)
  on conflict (user_id, episode_id) do nothing;

  insert into public.wallet_ledger (
    user_id, amount, balance_after, entry_type,
    reference_type, reference_id, idempotency_key
  ) values (
    v_user_id, -v_price, v_balance, 'EPISODE_UNLOCK',
    'EPISODE', p_episode_id::text, p_idempotency_key
  ) on conflict (user_id, idempotency_key) do nothing;

  return query select true, v_balance, v_price, false;
end;
$$;

revoke all on function public.unlock_episode_with_coins(uuid, text) from public;
grant execute on function public.unlock_episode_with_coins(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.series_categories enable row level security;
alter table public.series_translations enable row level security;
alter table public.episode_translations enable row level security;
alter table public.video_assets enable row level security;
alter table public.audio_tracks enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.playback_events enable row level security;
alter table public.daily_content_stats enable row level security;
alter table public.content_placements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.purchases enable row level security;
alter table public.vip_subscriptions enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.ai_jobs enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "categories_public_read" on public.categories for select
  using (is_active or public.is_admin());
create policy "categories_admin_write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "series_categories_public_read" on public.series_categories for select
  using (exists (select 1 from public.series s where s.id = series_id and s.is_published));
create policy "series_categories_admin_write" on public.series_categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "series_translations_public_read" on public.series_translations for select
  using (exists (select 1 from public.series s where s.id = series_id and s.is_published));
create policy "series_translations_admin_write" on public.series_translations for all
  using (public.is_admin()) with check (public.is_admin());

create policy "episode_translations_public_read" on public.episode_translations for select
  using (exists (
    select 1 from public.episodes e join public.series s on s.id = e.series_id
    where e.id = episode_id and s.is_published
  ));
create policy "episode_translations_admin_write" on public.episode_translations for all
  using (public.is_admin()) with check (public.is_admin());

create policy "video_assets_entitled_read" on public.video_assets for select
  using (
    public.is_admin() or exists (
      select 1
      from public.episodes e
      join public.series s on s.id = e.series_id
      where e.id = episode_id and s.is_published and (
        e.is_free or e.episode_number <= s.free_episodes or
        exists (select 1 from public.unlocks u where u.user_id = auth.uid() and u.episode_id = e.id) or
        exists (select 1 from public.purchases p where p.user_id = auth.uid() and p.series_id = s.id and (p.episode_id = e.id or p.purchase_type = 'SEASON'))
      )
    )
  );
create policy "video_assets_admin_write" on public.video_assets for all
  using (public.is_admin()) with check (public.is_admin());

create policy "audio_tracks_entitled_read" on public.audio_tracks for select
  using (exists (select 1 from public.video_assets v where v.id = video_asset_id));
create policy "audio_tracks_admin_write" on public.audio_tracks for all
  using (public.is_admin()) with check (public.is_admin());

create policy "likes_read_own" on public.likes for select using (auth.uid() = user_id);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

create policy "comments_public_read" on public.comments for select
  using (status = 'PUBLISHED' or auth.uid() = user_id or public.is_admin());
create policy "comments_insert_own" on public.comments for insert
  with check (auth.uid() = user_id);
create policy "comments_update_own" on public.comments for update
  using (auth.uid() = user_id or public.is_admin());

create policy "playback_events_insert" on public.playback_events for insert
  with check (user_id is null or auth.uid() = user_id);
create policy "playback_events_admin_read" on public.playback_events for select
  using (public.is_admin());

create policy "daily_stats_admin_read" on public.daily_content_stats for select
  using (public.is_admin());

create policy "placements_public_read" on public.content_placements for select
  using (is_active or public.is_admin());
create policy "placements_admin_write" on public.content_placements for all
  using (public.is_admin()) with check (public.is_admin());

create policy "orders_read_own" on public.orders for select
  using (auth.uid() = user_id or public.is_admin());
create policy "order_items_read_own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "purchases_read_own" on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());
create policy "subscriptions_read_own" on public.vip_subscriptions for select
  using (auth.uid() = user_id or public.is_admin());
create policy "wallet_ledger_read_own" on public.wallet_ledger for select
  using (auth.uid() = user_id or public.is_admin());

create policy "coupons_admin_all" on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());
create policy "coupon_redemptions_read_own" on public.coupon_redemptions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "webhook_events_admin_read" on public.webhook_events for select
  using (public.is_admin());
create policy "ai_jobs_admin_all" on public.ai_jobs for all
  using (public.is_admin()) with check (public.is_admin());
