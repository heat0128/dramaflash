import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminRevenue() {
  const svc = createServiceClient()
  const { data: txs } = await svc
    .from('transactions')
    .select('*')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(100)

  const total = (txs || []).reduce((s, t) => s + Number(t.amount_usd), 0)
  const last30 = (txs || [])
    .filter((t) => {
      const d = new Date(t.created_at)
      return d.getTime() > Date.now() - 30 * 86400_000
    })
    .reduce((s, t) => s + Number(t.amount_usd), 0)

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Revenue</h1>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10">
          <div className="text-xs opacity-60">All time</div>
          <div className="text-2xl font-extrabold">${total.toFixed(2)}</div>
        </div>
        <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10">
          <div className="text-xs opacity-60">Last 30 days</div>
          <div className="text-2xl font-extrabold">${last30.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="font-bold mb-3">Recent transactions</h2>
      <div className="space-y-2">
        {(txs || []).map((t) => (
          <div
            key={t.id}
            className="bg-white/[0.04] p-3 rounded-xl border border-white/10 flex justify-between"
          >
            <div>
              <div className="text-sm font-semibold">
                {t.type === 'coin_pack'
                  ? `+${t.coins_added} coins`
                  : `VIP +${t.vip_days_added} days`}
              </div>
              <div className="text-[11px] opacity-50">
                {new Date(t.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-sm font-bold text-brand-gold">
              ${Number(t.amount_usd).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
