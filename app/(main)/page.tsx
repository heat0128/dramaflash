import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import { CatalogHome } from '@/components/catalog-home'
import type { Series } from '@/lib/types'

export const dynamic = 'force-dynamic'

const SECTION_SIZE = 10

export default async function HomePage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [trendingResult, newResult, popularResult, recommendedResult, latestResult] =
    await Promise.all([
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(SECTION_SIZE),
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(SECTION_SIZE),
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('like_count', { ascending: false })
        .limit(SECTION_SIZE),
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('featured_order')
        .limit(SECTION_SIZE),
      supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(SECTION_SIZE)
    ])

  let continueWatching: ContinueWatchingItem[] = []
  if (user) {
    const { data } = await supabase
      .from('watch_history')
      .select('progress_seconds, episode:episode_id(*), series:series_id(*)')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(SECTION_SIZE)

    continueWatching = (data || [])
      .map((row) => normalizeHistoryRow(row))
      .filter((item): item is ContinueWatchingItem => Boolean(item))
  }

  return (
    <>
      <TopBar coins={user?.coins ?? 0} />
      <CatalogHome
        continueWatching={continueWatching}
        trending={(trendingResult.data || []) as Series[]}
        newReleases={(newResult.data || []) as Series[]}
        popular={(popularResult.data || []) as Series[]}
        recommended={(recommendedResult.data || []) as Series[]}
        latest={(latestResult.data || []) as Series[]}
      />
    </>
  )
}

export type ContinueWatchingItem = {
  series: Series
  episodeId: string
  episodeNumber: number
  progressSeconds: number
  durationSeconds: number | null
}

function normalizeHistoryRow(row: unknown): ContinueWatchingItem | null {
  const value = row as {
    progress_seconds?: number
    episode?: { id?: string; episode_number?: number; duration_seconds?: number | null } | null
    series?: Series | null
  }
  if (!value.episode?.id || !value.series) return null
  return {
    series: value.series,
    episodeId: value.episode.id,
    episodeNumber: value.episode.episode_number || 1,
    progressSeconds: value.progress_seconds || 0,
    durationSeconds: value.episode.duration_seconds ?? null
  }
}
