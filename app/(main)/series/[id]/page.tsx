import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isVipActive } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Lock, Play } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)

  const { data: series } = await supabase.from('series').select('*').eq('id', id).single()
  if (!series) notFound()

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('series_id', series.id)
    .order('episode_number')

  let unlockedIds = new Set<string>()
  if (user) {
    const { data: unlocks } = await supabase
      .from('unlocks')
      .select('episode_id')
      .eq('user_id', user.id)
    unlockedIds = new Set((unlocks || []).map((u) => u.episode_id))
  }

  return (
    <>
      <TopBar coins={user?.coins ?? 0} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        <div className="relative h-[260px] mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-pink to-purple-900">
          {series.cover_url && (
            <img
              src={series.cover_url}
              alt={series.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-2xl font-extrabold mb-1">{series.title}</h1>
            <div className="text-xs opacity-80 mb-2">
              {series.category && <span>{series.category} · </span>}
              {series.total_episodes} episodes
            </div>
            <p className="text-sm opacity-90 line-clamp-3">{series.description}</p>
          </div>
        </div>

        <div className="px-4 mt-6 mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold">Episodes</h2>
          <span className="text-xs opacity-60">{episodes?.length || 0} total</span>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4">
          {(episodes || []).map((ep) => {
            const isFree = ep.is_free || ep.episode_number <= series.free_episodes
            const isUnlocked = isFree || unlockedIds.has(ep.id) || vipActive
            return (
              <Link
                key={ep.id}
                href={`/watch/${ep.id}`}
                className="aspect-square rounded-xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center relative"
              >
                <div className="text-xl font-extrabold">{ep.episode_number}</div>
                <div className="absolute top-1.5 right-1.5">
                  {isUnlocked ? (
                    <Play size={11} className="text-brand-orange fill-brand-orange" />
                  ) : (
                    <Lock size={11} className="text-white/40" />
                  )}
                </div>
                {isFree && (
                  <div className="absolute bottom-1 left-1 right-1 text-[9px] text-center text-brand-gold font-bold">
                    FREE
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
