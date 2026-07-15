import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/favorites')
  const supabase = await createClient()

  const { data: favs } = await supabase
    .from('favorites')
    .select('series:series_id(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const series = (favs || []).map((f: any) => f.series).filter(Boolean)

  return (
    <>
      <TopBar coins={user.coins} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        <h1 className="px-4 pt-4 pb-2 text-lg font-extrabold">My Favorites</h1>
        {series.length === 0 ? (
          <div className="text-center py-20 opacity-50 text-sm">No favorites yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 px-4">
            {series.map((s: any) => (
              <Link
                key={s.id}
                href={`/series/${s.id}`}
                className="aspect-[2/3] rounded-xl relative overflow-hidden flex items-end p-2 bg-gradient-to-br from-purple-900/40 to-black"
              >
                {s.vertical_cover_url && (
                  <img
                    src={s.vertical_cover_url}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
                <div className="relative z-10 text-[11px] font-bold leading-tight line-clamp-2">
                  {s.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
