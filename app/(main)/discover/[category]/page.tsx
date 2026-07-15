import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/top-bar'
import { SeriesCard } from '@/components/catalog-home'
import type { Series } from '@/lib/types'

const CATEGORIES = new Set([
  'romance',
  'billionaire',
  'comedy',
  'revenge',
  'mafia',
  'fantasy',
  'werewolf',
  'family',
  'christian',
  'drama'
])

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryParam } = await params
  const category = decodeURIComponent(categoryParam).toLowerCase()
  if (!CATEGORIES.has(category)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from('series')
    .select('*')
    .eq('is_published', true)
    .ilike('category', category)
    .order('view_count', { ascending: false })
    .limit(30)

  return (
    <>
      <TopBar />
      <main className="min-h-screen px-4 pb-28 pt-24">
        <h1 className="mb-6 text-2xl font-black capitalize">{category}</h1>
        <div className="grid grid-cols-3 gap-x-3 gap-y-6">
          {((data || []) as Series[]).map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
        {!data?.length && (
          <div className="py-24 text-center text-sm text-white/45">No dramas yet</div>
        )}
      </main>
    </>
  )
}
