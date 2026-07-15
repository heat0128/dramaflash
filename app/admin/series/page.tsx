import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminSeriesPage() {
  const svc = createServiceClient()
  const { data: series } = await svc
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Series</h1>
        <Link
          href="/admin/series/new"
          className="bg-brand-gradient px-4 py-2 rounded-xl text-sm font-bold"
        >
          + New Series
        </Link>
      </div>

      <div className="space-y-2">
        {(series || []).map((s) => (
          <Link
            key={s.id}
            href={`/admin/series/${s.id}`}
            className="block bg-white/[0.04] border border-white/10 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{s.title}</div>
                <div className="text-xs opacity-60 mt-1">
                  {s.category || 'Uncategorized'} · {s.total_episodes} eps ·{' '}
                  {s.is_published ? '🟢 Published' : '⚪ Draft'}
                </div>
              </div>
              <span className="opacity-40">›</span>
            </div>
          </Link>
        ))}
        {(!series || series.length === 0) && (
          <div className="text-center py-12 opacity-60">
            <p className="mb-4">No series yet</p>
            <Link href="/admin/series/new" className="text-brand-orange font-bold">
              Create your first series →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
