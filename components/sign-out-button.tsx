'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const onClick = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/[0.04] border border-white/10 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white/70"
    >
      <LogOut size={16} /> Sign out
    </button>
  )
}
