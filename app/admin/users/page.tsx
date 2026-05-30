import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminUsers() {
  const svc = createServiceClient()
  const { data: users } = await svc.from('profiles')
    .select('*').order('created_at', { ascending: false }).limit(100)

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Users ({users?.length || 0})</h1>
      <div className="space-y-2">
        {(users || []).map(u => (
          <div key={u.id} className="bg-white/[0.04] border border-white/10 p-3 rounded-xl flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold">{u.email}</div>
              <div className="text-[11px] opacity-50">
                Coins: {u.coins} {u.is_vip && '· 👑 VIP'}
                {u.is_admin && ' · ADMIN'}
              </div>
            </div>
            <div className="text-[11px] opacity-50">
              {new Date(u.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
