-- =====================================================
-- BINGEGO UPDATE 4: Subtitles (multi-language)
-- Run this in Supabase SQL Editor (one time)
-- =====================================================

create table if not exists public.subtitles (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  lang text not null,            -- e.g. 'en','es','pt','fr','ja','ko','vi','ms','id','zh'
  label text not null,           -- human-readable name shown in the player
  storage_path text not null,    -- path in the 'subtitles' storage bucket (.vtt)
  created_at timestamptz not null default now(),
  unique (episode_id, lang)
);

create index if not exists subtitles_episode_idx on public.subtitles(episode_id);

alter table public.subtitles enable row level security;

-- Anyone can read subtitles (they're shown in the player)
drop policy if exists "subtitles_select" on public.subtitles;
create policy "subtitles_select" on public.subtitles for select using (true);

-- Only admins can write
drop policy if exists "admin_write_subtitles" on public.subtitles;
create policy "admin_write_subtitles" on public.subtitles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Public storage bucket for subtitle files (small text files, safe to be public)
insert into storage.buckets (id, name, public) values ('subtitles', 'subtitles', true)
  on conflict (id) do nothing;

drop policy if exists "subtitles_public_read" on storage.objects;
create policy "subtitles_public_read" on storage.objects for select
  using (bucket_id = 'subtitles');

drop policy if exists "admin_upload_subtitles" on storage.objects;
create policy "admin_upload_subtitles" on storage.objects for insert to authenticated
  with check (bucket_id = 'subtitles' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admin_delete_subtitles" on storage.objects;
create policy "admin_delete_subtitles" on storage.objects for delete to authenticated
  using (bucket_id = 'subtitles' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- =====================================================
-- DONE
-- =====================================================
