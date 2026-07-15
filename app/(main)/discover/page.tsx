import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DiscoverPage() {
  const supabase = createClient()
  const user = await getCurrentUser()

  const { data: trending } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(1)

  const { data: featured } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('featured_order')
    .limit(9)

  const { data: forYou } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .order('like_count', { ascending: false })
    .limit(9)

  const { data: latest } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const categories = Array.from(
    new Set([...(forYou || []), ...(latest || [])].map((s) => s.category).filter(Boolean))
  ) as string[]

  return (
    <>
      <TopBar coins={user?.coins ?? 0} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        {trending?.[0] && (
          <Link
            href={`/series/${trending[0].id}`}
            className="block mx-4 my-4 h-[200px] rounded-2xl relative overflow-hidden bg-gradient-to-br from-brand-pink to-purple-900 flex items-end p-4"
          >
            {trending[0].cover_url && (
              <img
                src={trending[0].cover_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
            <div className="relative z-10">
              <span className="inline-block bg-white/20 backdrop-blur px-2 py-0.5 rounded text-[10px] font-extrabold mb-2">
                🔥 TRENDING NOW
              </span>
              <h2 className="text-2xl font-black mb-1">{trending[0].title}</h2>
              <div className="text-xs opacity-90">
                {trending[0].category} · {trending[0].total_episodes} eps
              </div>
            </div>
          </Link>
        )}

        {categories.length > 0 && (
          <>
            <SectionHeader title="Categories" />
            <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/discover/${encodeURIComponent(cat)}`}
                  className="bg-white/[0.06] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border border-white/10"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </>
        )}

        {featured && featured.length > 0 && (
          <>
            <SectionHeader title="⭐ Recommended" />
            <Grid items={featured} />
          </>
        )}

        <SectionHeader title="For You" />
        <Grid items={forYou || []} />

        <SectionHeader title="New Releases" />
        <Grid items={latest || []} />
      </main>
    </>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 mt-4 mb-2 flex items-center justify-between">
      <h3 className="text-base font-extrabold">{title}</h3>
    </div>
  )
}

function Grid({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {items.map((s) => (
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
  )
}
