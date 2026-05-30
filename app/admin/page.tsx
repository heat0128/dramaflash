import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const svc = createServiceClient()
  const [
    { count: usersCount },
    { count: seriesCount },
    { count: episodesCount },
    { data: revenue }
  ] = await Promise.all([
    svc.from('profiles').select('*', { count: 'exact', head: true }),
    svc.from('series').select('*', { count: 'exact', head: true }),
    svc.from('episodes').select('*', { count: 'exact', head: true }),
    svc.from('transactions').select('amount_usd').eq('status', 'succeeded')
  ])

  const totalRevenue = (revenue || []).reduce((s, t) => s + Number(t.amount_usd), 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card label="Total Users" value={String(usersCount || 0)} />
        <Card label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <Card label="Series" value={String(seriesCount || 0)} />
        <Card label="Episodes" value={String(episodesCount || 0)} />
      </div>
      <div className="mt-8 bg-white/[0.04] p-5 rounded-2xl border border-white/10">
        <h2 className="font-bold mb-3">Quick Actions</h2>
        <div className="space-y-2 text-sm">
          <a href="/admin/upload" className="block bg-brand-gradient text-center py-3 rounded-xl font-bold">
            Upload new episode
          </a>
          <a href="/admin/series" className="block bg-white/[0.06] text-center py-3 rounded-xl font-semibold">
            Manage series
          </a>
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
