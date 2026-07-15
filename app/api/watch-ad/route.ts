import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    if (process.env.ENABLE_AD_REWARDS !== 'true') {
      return NextResponse.json(
        { error: 'Ad rewards require a verified provider callback' },
        { status: 503 }
      )
    }
    const supabase = await createClient()
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

    const svc = createServiceClient()

    // Load settings
    const { data: settingsRows } = await svc.from('app_settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const r of settingsRows || []) settings[r.key] = r.value

    if (settings.ad_enabled !== 'true') {
      return NextResponse.json({ error: 'Ad rewards are currently disabled' }, { status: 400 })
    }

    const rewardCoins = parseInt(settings.ad_reward_coins || '10', 10)
    const dailyLimit = parseInt(settings.ad_daily_limit || '5', 10)

    // Count today's rewards (UTC day)
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)
    const { count } = await svc
      .from('ad_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .gte('created_at', startOfDay.toISOString())

    const watchedToday = count || 0
    if (watchedToday >= dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${dailyLimit}/day). Come back tomorrow!`,
          watchedToday,
          dailyLimit
        },
        { status: 429 }
      )
    }

    // Credit coins + log
    const { data: profile } = await svc
      .from('profiles')
      .select('coins')
      .eq('id', authUser.id)
      .single()
    const newBalance = (profile?.coins || 0) + rewardCoins
    await svc.from('profiles').update({ coins: newBalance }).eq('id', authUser.id)
    await svc.from('ad_rewards').insert({ user_id: authUser.id, coins: rewardCoins })

    return NextResponse.json({
      ok: true,
      coins: newBalance,
      earned: rewardCoins,
      watchedToday: watchedToday + 1,
      dailyLimit
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
