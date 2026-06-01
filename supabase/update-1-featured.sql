-- =====================================================
-- BINGEGO UPDATE 1: Featured / recommended dramas
-- Run this in Supabase SQL Editor (one time)
-- =====================================================

alter table public.series
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_order integer not null default 0;

-- index for fast featured lookups
create index if not exists series_featured_idx
  on public.series(is_featured, featured_order)
  where is_published = true;
