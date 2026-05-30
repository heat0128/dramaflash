import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isVipActive } from '@/lib/auth'
import { VideoFeed } from '@/components/video-feed'
import { TopBar } from '@/components/top-bar'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)

  // Get first episode of each published series for the feed
  const { data: series } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const seriesIds = (series || []).map(s => s.id)
  const { data: episodes } = seriesIds.length
    ? await supabase.from('episodes')
        .select('*')
        .in('series_id', seriesIds)
        .lte('episode_number', 1)
        .order('episode_number')
    : { data: [] as any[] }

  // User's unlocked episode IDs
  let unlockedIds = new Set<string>()
  if (user) {
    const { data: unlocks } = await supabase
      .from('unlocks').select('episode_id').eq('user_id', user.id)
    unlockedIds = new Set((unlocks || []).map(u => u.episode_id))
  }

  const feedItems = (episodes || []).map(ep => {
    const s = series!.find(s => s.id === ep.series_id)!
    const isUnlocked = ep.is_free
      || ep.episode_number <= s.free_episodes
      || unlockedIds.has(ep.id)
      || vipActive
    return { episode: ep, series: s, isUnlocked }
  })

  return (
    <>
      <TopBar coins={user?.coins ?? 0} transparent />
      {feedItems.length > 0 ? (
        <VideoFeed
          initialItems={feedItems}
          initialCoins={user?.coins ?? 0}
          isVip={vipActive}
        />
      ) : (
        <EmptyState />
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-8">
      <div className="text-6xl mb-4">🎬</div>
      <h2 className="text-xl font-bold mb-2">No dramas yet</h2>
      <p className="text-sm opacity-60">
        Sign in to the admin panel and upload your first series to get started.
      </p>
      <a href="/admin" className="mt-6 px-5 py-2.5 rounded-full bg-brand-gradient text-sm font-bold">
        Go to Admin
      </a>
    </div>
  )
}
