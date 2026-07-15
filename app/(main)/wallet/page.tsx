import Link from 'next/link'
import { Check, Clock3, Gift, ShieldCheck } from 'lucide-react'
import { getCurrentUser, isVipActive } from '@/lib/auth'
import { TopBar } from '@/components/top-bar'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const user = await getCurrentUser()
  const vipActive = isVipActive(user)

  return (
    <>
      <TopBar coins={user?.coins ?? 0} />
      <main className="min-h-screen px-4 pb-[110px] pt-[88px]">
        <div className="brand-ring overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-brand-blue/10 p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient">
            <Clock3 size={22} />
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue">
            Early access
          </div>
          <h1 className="mt-2 text-2xl font-black">VIP and purchases are coming later</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            BingeGo is currently free to explore. We do not accept payments, sell coins, or start
            paid subscriptions at this stage.
          </p>
        </div>

        <section className="mt-7 space-y-3">
          <StatusRow
            icon={<Check size={18} />}
            title="Free episodes"
            text="Available without payment"
          />
          <StatusRow
            icon={<Gift size={18} />}
            title="Promotional access"
            text={`${user?.coins ?? 0} complimentary coins on this account`}
          />
          <StatusRow
            icon={<ShieldCheck size={18} />}
            title="No surprise charges"
            text={
              vipActive ? 'Your promotional VIP access is active' : 'No payment method is requested'
            }
          />
        </section>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-white/65">
          Paid access will only be enabled after a verified payment provider is available. Prices,
          renewal terms, and cancellation controls will be shown clearly before any future purchase.
        </div>

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/55">
          <Link href="/legal/terms" className="hover:text-white">
            Terms of Use
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/legal/refunds" className="hover:text-white">
            Refund Policy
          </Link>
          <a href="mailto:heatcolin@gmail.com" className="hover:text-white">
            Contact support
          </a>
        </div>
      </main>
    </>
  )
}

function StatusRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-pink/15 text-brand-pink">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-xs text-white/50">{text}</div>
      </div>
    </div>
  )
}
