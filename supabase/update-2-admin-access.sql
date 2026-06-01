-- =====================================================
-- BINGEGO UPDATE 2: Admin write permissions
-- Run this in Supabase SQL Editor (one time)
-- This lets your admin account create series, upload
-- videos, edit prices, etc. (writes are blocked by
-- default for safety).
-- =====================================================

-- 1) MAKE YOURSELF AN ADMIN
--    Replace the email below with the email you registered with on the site.
update public.profiles set is_admin = true
  where email = 'REPLACE_WITH_YOUR_EMAIL';

-- 2) Admin write policies (only users with is_admin = true can write)
-- SERIES
drop policy if exists "admin_write_series" on public.series;
create policy "admin_write_series" on public.series for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Admins can also SELECT unpublished (drafts) — needed in the admin panel
drop policy if exists "admin_select_series" on public.series;
create policy "admin_select_series" on public.series for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- EPISODES
drop policy if exists "admin_write_episodes" on public.episodes;
create policy "admin_write_episodes" on public.episodes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- COIN PACKS
drop policy if exists "admin_write_packs" on public.coin_packs;
create policy "admin_write_packs" on public.coin_packs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- SUBSCRIPTION PLANS
drop policy if exists "admin_write_plans" on public.subscription_plans;
create policy "admin_write_plans" on public.subscription_plans for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- 3) Storage: let admins upload/delete videos and covers
drop policy if exists "admin_upload_videos" on storage.objects;
create policy "admin_upload_videos" on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admin_modify_videos" on storage.objects;
create policy "admin_modify_videos" on storage.objects for update to authenticated
  using (bucket_id = 'videos' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admin_delete_videos" on storage.objects;
create policy "admin_delete_videos" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admin_upload_covers" on storage.objects;
create policy "admin_upload_covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admin_modify_covers" on storage.objects;
create policy "admin_modify_covers" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- =====================================================
-- DONE. After running, sign out and back in on the site.
-- =====================================================
