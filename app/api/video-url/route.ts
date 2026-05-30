import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isVipActive } from '@/lib/auth'

// Returns a signed, time-limited URL for a video, but ONLY if the user
// is allowed to watch (free episode, VIP, or has unlocked it).
export async function POST(req: Request) {
  try {
    const { episodeId } = await req.json()
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    const svc = createServiceClient()
    const { data: ep } = await svc
      .from('episodes').select('*, series:series_id(*)').eq('id', episodeId).single()
    if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isFree = ep.is_free || ep.episode_number <= ep.series.free_episodes
    let allowed = isFree

    if (!allowed && authUser) {
      const { data: profile } = await svc.from('profiles').select('*').eq('id', authUser.id).single()
      if (isVipActive(profile)) allowed = true
      if (!allowed) {
        const { data: unlock } = await svc.from('unlocks')
          .select('id').eq('user_id', authUser.id).eq('episode_id', episodeId).maybeSingle()
        if (unlock) allowed = true
      }
    }

    if (!allowed) return NextResponse.json({ error: 'Locked' }, { status: 403 })

    // If video_url is already a full https URL (e.g. external CDN), just return it.
    if (ep.video_url.startsWith('http')) {
      return NextResponse.json({ url: ep.video_url })
    }

    // Otherwise it's a storage path in the private 'videos' bucket: sign it.
    const { data: signed, error } = await svc.storage
      .from('videos').createSignedUrl(ep.video_url, 60 * 60) // 1 hour
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ url: signed.signedUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
