'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Wallet, User } from 'lucide-react'
import clsx from 'clsx'

const TABS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/profile', icon: User, label: 'Me' }
]

export function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex z-30 border-t border-white/5"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        paddingTop: '8px',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(30px)'
      }}
    >
      {TABS.map(tab => {
        const Icon = tab.icon
        const active = pathname === tab.href ||
                       (tab.href !== '/' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href} href={tab.href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-1.5 transition-opacity',
              active ? 'opacity-100' : 'opacity-50'
            )}
          >
            <Icon size={22} className={active ? 'text-brand-pink' : 'text-white'} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
