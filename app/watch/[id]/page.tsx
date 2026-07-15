import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isVipActive } from '@/lib/auth'
import { VideoFeed } from '@/components/video-feed'
import { TopBar } from '@/components/top-bar'
import { ToastProvider } from '@/components/toast'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WatchPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)

  // Find the episode and its full series
  const { data: startEp } = await supabase.from('episodes').select('*').eq('id', params.id).single()
  if (!startEp) notFound()

  const { data: series } = await supabase
    .from('series')
    .select('*')
    .eq('id', startEp.series_id)
    .single()
  if (!series) notFound()

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('series_id', series.id)
    .gte('episode_number', startEp.episode_number)
    .order('episode_number')

  let unlockedIds = new Set<string>()
  if (user) {
    const { data: unlocks } = await supabase
      .from('unlocks')
      .select('episode_id')
      .eq('user_id', user.id)
    unlockedIds = new Set((unlocks || []).map((u) => u.episode_id))
  }

  const feedItems = (episodes || []).map((ep) => {
    const isUnlocked =
      ep.is_free || ep.episode_number <= series.free_episodes || unlockedIds.has(ep.id) || vipActive
    return { episode: ep, series, isUnlocked }
  })

  return (
    <ToastProvider>
      <TopBar coins={user?.coins ?? 0} transparent />
      <VideoFeed
        initialItems={feedItems}
        initialCoins={user?.coins ?? 0}
        isVip={vipActive}
        adRewardsEnabled={process.env.ENABLE_AD_REWARDS === 'true'}
      />
    </ToastProvider>
  )
}
