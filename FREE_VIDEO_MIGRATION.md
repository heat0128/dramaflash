# Free Video Hosting Migration

This project now supports four video source types in the existing `episodes.video_url` field:

- YouTube watch, embed, shorts, or youtu.be URLs
- Dailymotion video or dai.ly URLs
- HLS `.m3u8` URLs
- Direct MP4/video URLs

## Recommended Free Setup For Testing

Use this while episode output is slow and traffic is small:

1. Keep the website on Vercel Free or another free Next.js host.
2. Keep Supabase Free for auth, database, covers, subtitles, coins, and unlock records.
3. Upload public/free test videos to YouTube or Dailymotion.
4. In Admin > Series > Add Episode, paste the video URL instead of uploading a file.
5. Keep thumbnails in Supabase covers storage, because they are small and already optimized.

## Migration Steps

For each existing episode:

1. Download or locate the source video file.
2. Upload it to YouTube or Dailymotion.
3. Copy the public video URL.
4. Open the episode's series in the admin panel.
5. Add the episode again with the same episode number and the external URL, or update `episodes.video_url` directly in Supabase.

For locked paid episodes during testing, treat the video platform URL as not truly private. The app still hides the player behind the unlock flow, but public/free hosts are not DRM systems.

## Upgrade Path Later

When the site needs a paid-drama experience for real U.S. traffic:

1. Move episode files to a dedicated video platform such as Cloudflare Stream, Mux, Bunny Stream, or another HLS provider.
2. Store the provider's HLS `.m3u8` URL in `episodes.video_url`.
3. Keep the current app database, admin panel, unlock logic, payment logic, and feed UI.
4. Add webhook/API integration only when upload volume becomes large enough to justify it.

This keeps today's free testing setup compatible with a future professional streaming setup.
