import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isVipActive } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { episodeId, method, idempotencyKey } = await req.json()
    if (!episodeId || method !== 'coin') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = await createClient()
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
      const { data, error } = await supabase.rpc('unlock_episode_with_coins', {
        p_episode_id: episodeId,
        p_idempotency_key: idempotencyKey || crypto.randomUUID()
      })

      if (error) throw error

      const result = Array.isArray(data) ? data[0] : data
      if (!result?.success) {
        return NextResponse.json({ error: 'Not enough coins' }, { status: 402 })
      }

      return NextResponse.json({
        ok: true,
        coins: result.balance,
        coinsSpent: result.coins_spent,
        alreadyAccessible: result.already_unlocked
      })
    }

    return NextResponse.json({ error: 'Unknown method' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
