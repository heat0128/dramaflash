import { getCurrentUser, isVipActive } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/top-bar'
import { Crown } from 'lucide-react'
import Link from 'next/link'
import { SignOutButton } from '@/components/sign-out-button'
import { ProfileMenu } from '@/components/profile-menu'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)
  const supabase = await createClient()

  let stats = { favorites: 0, watched: 0 }
  if (user) {
    const [{ count: favCount }, { count: histCount }] = await Promise.all([
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('watch_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ])
    stats = { favorites: favCount || 0, watched: histCount || 0 }
  }

  return (
    <>
      <TopBar coins={user?.coins ?? 0} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        <div className="px-4 py-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-2xl font-extrabold">
            {(user?.display_name || user?.email || 'G')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-extrabold">
              {user?.display_name || 'Guest'}
              {vipActive && <Crown size={16} className="inline ml-1.5 text-brand-gold" />}
            </div>
            {user ? (
              <div className="text-xs opacity-60">{user.email}</div>
            ) : (
              <Link href="/login" className="text-xs text-brand-orange font-bold">
                Tap to sign in or sign up
              </Link>
            )}
          </div>
        </div>

        {user && (
          <div className="flex px-4 gap-2 mb-4">
            <StatBox num={stats.favorites} label="Saved" />
            <StatBox num={stats.watched} label="Watched" />
            <StatBox num={user.coins} label="Coins" />
          </div>
        )}

        <ProfileMenu vipActive={vipActive} isAdmin={!!user?.is_admin} />

        {user && (
          <div className="px-4 mt-6">
            <SignOutButton />
          </div>
        )}
      </main>
    </>
  )
}

function StatBox({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex-1 bg-white/[0.04] rounded-xl p-3 text-center">
      <div className="text-lg font-extrabold">{num}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{label}</div>
    </div>
  )
}
