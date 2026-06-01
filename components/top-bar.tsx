'use client'

import Link from 'next/link'
import { Search, Coins } from 'lucide-react'

export function TopBar({ coins = 0, transparent = false }: { coins?: number; transparent?: boolean }) {
  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center justify-between px-4 z-30"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: '12px',
        background: transparent
          ? 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)'
          : 'rgba(10,10,10,0.85)',
        backdropFilter: transparent ? 'none' : 'blur(30px)',
        borderBottom: transparent ? 'none' : '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <Link href="/" className="flex items-center gap-2">
        <img src="/favicon.png" alt="BingeGo" className="w-7 h-7 rounded-md" />
        <span className="text-xl font-black tracking-tight text-brand-gradient">BingeGo</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full text-sm font-bold"
        >
          <Coins size={14} className="text-brand-gold" />
          <span>{coins}</span>
        </Link>
        <Link href="/search"><Search size={22} /></Link>
      </div>
    </header>
  )
}
