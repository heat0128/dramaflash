import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const svc = createServiceClient()
  const [
    { count: usersCount },
    { count: vipCount },
    { count: seriesCount },
    { count: episodesCount },
    { data: revenue },
    { data: topViewed },
    { data: unlockRows }
  ] = await Promise.all([
    svc.from('profiles').select('*', { count: 'exact', head: true }),
    svc.from('profiles').select('*', { count: 'exact', head: true }).eq('is_vip', true),
    svc.from('series').select('*', { count: 'exact', head: true }),
    svc.from('episodes').select('*', { count: 'exact', head: true }),
    svc.from('transactions').select('amount_usd').eq('status', 'succeeded'),
    svc.from('series').select('id, title, view_count').order('view_count', { ascending: false }).limit(5),
    svc.from('unlocks').select('coins_spent, episode:episode_id(series_id)').eq('method', 'coin')
  ])

  const totalRevenue = (revenue || []).reduce((s, t) => s + Number(t.amount_usd), 0)

  // Aggregate coins earned per series from unlocks
  const earnMap: Record<string, number> = {}
  for (const row of (unlockRows || []) as any[]) {
    const sid = row.episode?.series_id
    if (sid) earnMap[sid] = (earnMap[sid] || 0) + (row.coins_spent || 0)
  }
  const topEarnIds = Object.entries(earnMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  let topEarnSeries: { id: string; title: string; coins: number }[] = []
  if (topEarnIds.length) {
    const { data: ts } = await svc.from('series').select('id, title').in('id', topEarnIds.map(e => e[0]))
    topEarnSeries = topEarnIds.map(([id, coins]) => ({
      id, coins, title: (ts || []).find((s: any) => s.id === id)?.title || '—'
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card label="Total Users" value={String(usersCount || 0)} />
        <Card label="VIP Members" value={String(vipCount || 0)} />
        <Card label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <Card label="Series / Episodes" value={`${seriesCount || 0} / ${episodesCount || 0}`} />
      </div>

      <Panel title="🔥 Most Watched Series">
        {(topViewed || []).length === 0 ? <Empty /> : (topViewed || []).map((s: any, i: number) => (
          <Row key={s.id} rank={i + 1} name={s.title} value={`${Number(s.view_count).toLocaleString()} views`} />
        ))}
      </Panel>

      <Panel title="💰 Top Earning Series (by coins unlocked)">
        {topEarnSeries.length === 0 ? <Empty /> : topEarnSeries.map((s, i) => (
          <Row key={s.id} rank={i + 1} name={s.title} value={`${s.coins.toLocaleString()} coins`} />
        ))}
      </Panel>

      <div className="bg-white/[0.04] p-5 rounded-2xl border border-white/10">
        <h2 className="font-bold mb-3">Quick Actions</h2>
        <div className="space-y-2 text-sm">
          <a href="/admin/series" className="block bg-brand-gradient text-center py-3 rounded-xl font-bold">Manage series & episodes</a>
          <a href="/admin/pricing" className="block bg-white/[0.06] text-center py-3 rounded-xl font-semibold">Manage prices & packs</a>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10">
      <div className="text-[11px] opacity-60 mb-1">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  )
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10">
      <h2 className="font-bold mb-3 text-sm">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
function Row({ rank, name, value }: { rank: number; name: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-5 text-center font-extrabold text-brand-orange text-sm">{rank}</span>
      <span className="flex-1 text-sm truncate">{name}</span>
      <span className="text-xs opacity-60">{value}</span>
    </div>
  )
}
function Empty() { return <div className="text-xs opacity-40 py-2">No data yet</div> }
