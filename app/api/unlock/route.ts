import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isVipActive } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { episodeId, method } = await req.json()
    if (!episodeId || !['coin', 'ad'].includes(method)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Sign in to unlock' }, { status: 401 })

    const svc = createServiceClient()

    // Get profile + episode + series
    const [{ data: profile }, { data: ep }] = await Promise.all([
      svc.from('profiles').select('*').eq('id', authUser.id).single(),
      svc.from('episodes').select('*, series:series_id(*)').eq('id', episodeId).single()
    ])

    if (!profile || !ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // VIP / free check
    const isFree = ep.is_free || ep.episode_number <= ep.series.free_episodes
    if (isFree || isVipActive(profile)) {
      return NextResponse.json({ ok: true, coins: profile.coins, alreadyAccessible: true })
    }

    // Already unlocked?
    const { data: existing } = await svc
      .from('unlocks')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('episode_id', episodeId)
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, coins: profile.coins })

    if (method === 'coin') {
      const price = ep.series.coin_price ?? 30
      if (profile.coins < price) {
        return NextResponse.json({ error: 'Not enough coins' }, { status: 402 })
      }
      // Deduct + insert unlock
      const { error: e1 } = await svc
        .from('profiles')
        .update({ coins: profile.coins - price })
        .eq('id', authUser.id)
      if (e1) throw e1
      await svc.from('unlocks').insert({
        user_id: authUser.id,
        episode_id: episodeId,
        method: 'coin',
        coins_spent: price
      })
      return NextResponse.json({ ok: true, coins: profile.coins - price })
    }

    if (method === 'ad') {
      // Trust server-side that ad SDK confirmed completion (in prod, verify ad reward callback)
      await svc.from('unlocks').insert({
        user_id: authUser.id,
        episode_id: episodeId,
        method: 'ad',
        coins_spent: 0
      })
      return NextResponse.json({ ok: true, coins: profile.coins })
    }

    return NextResponse.json({ error: 'Unknown method' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
