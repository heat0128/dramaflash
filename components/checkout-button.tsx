'use client'

import { useState } from 'react'
import { useToast } from '@/components/toast'

export function CheckoutButton({
  type,
  itemId,
  children,
  className
}: {
  type: 'coin_pack' | 'subscription' | 'episode' | 'season'
  itemId: string
  children: React.ReactNode
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const { show: toast } = useToast()

  const onClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId, idempotencyKey: crypto.randomUUID() })
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Failed to start checkout')
        setLoading(false)
        return
      }
      window.location.href = json.url
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Network error')
      setLoading(false)
    }
  }

  return (
    <button onClick={onClick} disabled={loading} className={className}>
      {loading ? 'Loading...' : children}
    </button>
  )
}
