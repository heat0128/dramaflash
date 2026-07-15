import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/top-bar'
import { SeriesCard } from '@/components/catalog-home'
import type { Series } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q || '').trim().slice(0, 80)
  const supabase = await createClient()
  const { data } = query
    ? await supabase
        .from('series')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.%${escapeSearch(query)}%,description.ilike.%${escapeSearch(query)}%`)
        .order('view_count', { ascending: false })
        .limit(24)
    : { data: [] as Series[] }

  return (
    <>
      <TopBar />
      <main className="min-h-screen px-4 pb-28 pt-24">
        <form className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4">
          <Search size={18} className="text-white/45" />
          <input
            name="q"
            defaultValue={query}
            maxLength={80}
            autoFocus
            placeholder="Search dramas"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
          />
        </form>
        {query && (
          <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6">
            {((data || []) as Series[]).map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}
        {query && !data?.length && (
          <div className="py-24 text-center text-sm text-white/45">No matching dramas</div>
        )}
        {!query && (
          <div className="py-24 text-center text-sm text-white/45">
            Search by title, story, or keyword
          </div>
        )}
        <Link href="/discover" className="mt-8 block text-center text-xs text-brand-orange">
          Browse all categories
        </Link>
      </main>
    </>
  )
}

function escapeSearch(value: string) {
  return value.replace(/[,%()]/g, ' ')
}
