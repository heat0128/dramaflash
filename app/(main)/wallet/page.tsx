import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isVipActive } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'
import { ToastProvider } from '@/components/toast'
import { CheckoutButton } from '@/components/checkout-button'
import { EarnCoins } from '@/components/earn-coins'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = createClient()
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)

  const { data: packs } = await supabase
    .from('coin_packs').select('*').eq('is_active', true).order('display_order')

  const { data: plans } = await supabase
    .from('subscription_plans').select('*').eq('is_active', true).order('display_order')

  // Ad-reward settings + today's count
  const { data: settingsRows } = await supabase.from('app_settings').select('key, value')
  const settings: Record<string, string> = {}
  for (const r of settingsRows || []) settings[r.key] = r.value
  const adEnabled = settings.ad_enabled === 'true'
  const adReward = parseInt(settings.ad_reward_coins || '10', 10)
  const adLimit = parseInt(settings.ad_daily_limit || '5', 10)

  let watchedToday = 0
  if (user && adEnabled) {
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase.from('ad_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())
    watchedToday = count || 0
  }

  return (
    <ToastProvider>
      <TopBar coins={user?.coins ?? 0} />
      <main className="pt-[68px] pb-[90px] min-h-screen">
        <h1 className="px-4 pt-4 text-lg font-extrabold">Wallet & VIP</h1>

        <div className="mx-4 mt-4 p-5 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a, #2a1a1a)',
            border: '1px solid rgba(255,200,58,0.2)'
          }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,200,58,0.15), transparent 70%)' }}/>
          <div className="relative">
            <div className="text-[11px] tracking-widest font-bold text-brand-gold mb-1.5">
              VIP MEMBERSHIP
            </div>
            <div className="text-xl font-extrabold mb-1">
              {!user ? 'Sign in to view' : vipActive ? 'Active VIP Member' : 'Not subscribed yet'}
            </div>
            <div className="text-[13px] opacity-70">
              Balance: <span className="font-bold text-brand-gold">{user?.coins ?? 0}</span> coins
            </div>
            {vipActive && user?.vip_expires_at && (
              <div className="text-[12px] opacity-60 mt-1">
                Expires {new Date(user.vip_expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {user && adEnabled && (
          <>
            <SectionHeader title="Earn Free Coins" />
            <div className="px-4">
              <EarnCoins
                rewardCoins={adReward}
                dailyLimit={adLimit}
                watchedToday={watchedToday}
                enabled={adEnabled}
              />
            </div>
          </>
        )}

        <SectionHeader title="Subscribe to VIP · Watch unlimited" />
        <div className="px-4 space-y-2.5">
          {(plans || []).map(plan => (
            <CheckoutButton
              key={plan.id}
              type="subscription" itemId={plan.id}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border ${
                plan.is_featured
                  ? 'bg-gradient-to-br from-brand-pink/10 to-brand-orange/5 border-brand-pink/30'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
              <div className="text-left">
                <div className="text-[15px] font-bold">
                  {plan.name} {plan.is_featured && '🔥'}
                </div>
                <div className="text-[11px] opacity-60">
                  {plan.duration_days} days
                  {plan.coins_included > 0 && ` · ${plan.coins_included} coins included`}
                </div>
              </div>
              <div className="text-base font-extrabold text-brand-orange">
                ${plan.price_usd}
              </div>
            </CheckoutButton>
          ))}
        </div>

        <SectionHeader title="Recharge Coins" />
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {(packs || []).map(pack => (
            <CheckoutButton
              key={pack.id}
              type="coin_pack" itemId={pack.id}
              className={`p-4 rounded-2xl text-center relative border-2 transition-transform active:scale-[0.97] ${
                pack.label
                  ? 'bg-gradient-to-br from-brand-gold/10 to-transparent border-brand-gold'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
              {pack.label && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-brand-gold to-brand-orange text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                  {pack.label.toUpperCase()}
                </div>
              )}
              <div className="text-[22px] font-black mb-0.5">
                <span className="text-brand-gold">¤</span> {pack.coins}
              </div>
              <div className="text-[10px] text-brand-orange font-bold min-h-[12px] mb-2">
                {pack.bonus_coins > 0 ? `+${pack.bonus_coins} bonus` : ''}
              </div>
              <div className="text-sm font-bold">${pack.price_usd}</div>
            </CheckoutButton>
          ))}
        </div>

        <div className="h-8" />
      </main>
    </ToastProvider>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="px-4 mt-6 mb-3 text-base font-extrabold">{title}</h2>
}
