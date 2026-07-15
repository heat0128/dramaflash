import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true, anonymous: true })

  const body = (await request.json()) as {
    episodeId?: string
    seriesId?: string
    progressSeconds?: number
  }
  if (!body.episodeId || !body.seriesId || !Number.isFinite(body.progressSeconds)) {
    return NextResponse.json({ error: 'Invalid progress' }, { status: 400 })
  }

  const progressSeconds = Math.max(0, Math.floor(body.progressSeconds || 0))
  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: user.id,
      episode_id: body.episodeId,
      series_id: body.seriesId,
      progress_seconds: progressSeconds,
      watched_at: new Date().toISOString()
    },
    { onConflict: 'user_id,episode_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
