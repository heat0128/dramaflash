import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isVipActive } from '@/lib/auth'
import { createStreamToken, streamHlsUrl } from '@/lib/cloudflare/stream'

// Returns a signed, time-limited URL for a video, but ONLY if the user
// is allowed to watch (free episode, VIP, or has unlocked it).
export async function POST(req: Request) {
  try {
    const { episodeId } = await req.json()
    const supabase = createClient()
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser()

    const svc = createServiceClient()
    const { data: ep } = await svc
      .from('episodes')
      .select('*, series:series_id(*)')
      .eq('id', episodeId)
      .single()
    if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isFree = ep.is_free || ep.episode_number <= ep.series.free_episodes
    let allowed = isFree

    if (!allowed && authUser) {
      const { data: profile } = await svc
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (isVipActive(profile)) allowed = true
      if (!allowed) {
        const { data: unlock } = await svc
          .from('unlocks')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('episode_id', episodeId)
          .maybeSingle()
        if (unlock) allowed = true
      }
      if (!allowed) {
        const { data: purchase } = await svc
          .from('purchases')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('series_id', ep.series_id)
          .or(`episode_id.eq.${episodeId},purchase_type.eq.SEASON`)
          .maybeSingle()
        if (purchase) allowed = true
      }
    }

    if (!allowed) return NextResponse.json({ error: 'Locked' }, { status: 403 })

    let resumeAt = 0
    if (authUser) {
      const { data: history } = await svc
        .from('watch_history')
        .select('progress_seconds')
        .eq('user_id', authUser.id)
        .eq('episode_id', episodeId)
        .maybeSingle()
      resumeAt = history?.progress_seconds || 0
    }

    const { data: streamAsset } = await svc
      .from('video_assets')
      .select('id, provider_asset_id, aspect_ratio')
      .eq('episode_id', episodeId)
      .eq('provider', 'CLOUDFLARE_STREAM')
      .eq('type', 'FULL_VIDEO')
      .eq('status', 'READY')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (streamAsset?.provider_asset_id) {
      const { token } = await createStreamToken(streamAsset.provider_asset_id)
      return NextResponse.json({
        url: streamHlsUrl(token),
        assetId: streamAsset.id,
        aspectRatio: streamAsset.aspect_ratio,
        resumeAt,
        expiresIn: 900
      })
    }

    // If video_url is already a full https URL (e.g. external CDN), just return it.
    if (ep.video_url.startsWith('http')) {
      return NextResponse.json({
        url: ep.video_url,
        aspectRatio: ep.aspect_ratio || '9:16',
        resumeAt
      })
    }

    // Otherwise it's a storage path in the private 'videos' bucket: sign it.
    const { data: signed, error } = await svc.storage
      .from('videos')
      .createSignedUrl(ep.video_url, 60 * 60) // 1 hour
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      url: signed.signedUrl,
      aspectRatio: ep.aspect_ratio || '9:16',
      resumeAt
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create playback URL' },
      { status: 500 }
    )
  }
}
