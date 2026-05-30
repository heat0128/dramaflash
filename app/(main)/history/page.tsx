import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/history')
  const supabase = createClient()

  const { data: history } = await supabase
    .from('watch_history')
    .select('*, episode:episode_id(*), series:series_id(*)')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .limit(50)

  return (
    <>
      <TopBar coins={user.coins} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        <h1 className="px-4 pt-4 pb-2 text-lg font-extrabold">Watch History</h1>
        {!history || history.length === 0 ? (
          <div className="text-center py-20 opacity-50 text-sm">Nothing watched yet</div>
        ) : (
          <div className="px-4 space-y-2">
            {history.map((h: any) => (
              <Link key={h.episode_id} href={`/watch/${h.episode_id}`}
                className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-purple-900 to-black flex-shrink-0 overflow-hidden">
                  {h.series?.vertical_cover_url && (
                    <img src={h.series.vertical_cover_url} alt="" className="w-full h-full object-cover"/>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{h.series?.title}</div>
                  <div className="text-xs opacity-60">Episode {h.episode?.episode_number}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
