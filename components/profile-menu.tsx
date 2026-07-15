'use client'

import Link from 'next/link'
import {
  Crown,
  Bookmark,
  Clock,
  FileText,
  HelpCircle,
  Settings,
  Globe,
  ShieldCheck
} from 'lucide-react'
import { useI18n, LanguageSwitcher } from '@/lib/i18n'

export function ProfileMenu({ vipActive, isAdmin }: { vipActive: boolean; isAdmin: boolean }) {
  const { t } = useI18n()
  return (
    <div className="divide-y divide-white/5">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
          <Globe size={18} className="text-brand-pink" />
        </div>
        <div className="flex-1 text-sm">{t('profile.language')}</div>
        <LanguageSwitcher />
      </div>
      <MenuItem
        href="/wallet"
        icon={<Crown size={18} className="text-brand-orange" />}
        label={t('profile.getVip')}
      />
      <MenuItem href="/favorites" icon={<Bookmark size={18} />} label={t('profile.favorites')} />
      <MenuItem href="/history" icon={<Clock size={18} />} label={t('profile.history')} />
      <MenuItem
        href="mailto:heatcolin@gmail.com"
        icon={<HelpCircle size={18} />}
        label={t('profile.help')}
      />
      <MenuItem href="/legal/privacy" icon={<ShieldCheck size={18} />} label="Privacy Policy" />
      <MenuItem href="/legal/terms" icon={<FileText size={18} />} label="Terms & Refunds" />
      {isAdmin && (
        <MenuItem
          href="/admin"
          icon={<Settings size={18} className="text-brand-pink" />}
          label="Admin Panel"
        />
      )}
    </div>
  )
}

function MenuItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 text-sm">{label}</div>
      <span className="opacity-30">›</span>
    </Link>
  )
}
