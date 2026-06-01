'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg('')
    const supabase = createClient()
    const res = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` } })

    if (res.error) { setMsg(res.error.message); setLoading(false); return }

    if (mode === 'signup' && !res.data.session) {
      setMsg('Check your email to confirm your account.')
      setLoading(false); return
    }
    router.push('/'); router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col px-6 pt-20"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)' }}>
      <img src="/logo.png" alt="BingeGo" className="w-44 h-44 object-contain mb-2 rounded-2xl" />
      <p className="text-sm opacity-60 mb-8">
        {mode === 'signin' ? 'Welcome back' : 'Create your account to start watching'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-brand-pink"
        />
        <input
          type="password" placeholder="Password (at least 6 chars)"
          value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-brand-pink"
        />
        {msg && <div className="text-sm text-brand-orange">{msg}</div>}
        <button type="submit" disabled={loading}
          className="w-full bg-brand-gradient py-3.5 rounded-xl font-bold text-base disabled:opacity-60">
          {loading ? '...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="mt-6 text-sm text-center opacity-70">
        {mode === 'signin'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </main>
  )
}
