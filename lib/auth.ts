import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return profile as Profile | null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (user.is_admin || (user.email && adminEmails.includes(user.email))) return user
  throw new Error('FORBIDDEN')
}

// Check if user has active VIP
export function isVipActive(profile: Profile | null): boolean {
  if (!profile?.is_vip) return false
  if (!profile.vip_expires_at) return false
  return new Date(profile.vip_expires_at) > new Date()
}
