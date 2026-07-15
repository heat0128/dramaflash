'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/toast'
import { Play, Gift } from 'lucide-react'

export function EarnCoins({
  rewardCoins,
  dailyLimit,
  watchedToday: initialWatched,
  enabled
}: {
  rewardCoins: number
  dailyLimit: number
  watchedToday: number
  enabled: boolean
}) {
  const [watched, setWatched] = useState(initialWatched)
  const [showAd, setShowAd] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [crediting, setCrediting] = useState(false)
  const { show: toast } = useToast()

  const remaining = Math.max(0, dailyLimit - watched)

  // countdown timer while the (simulated) ad plays
  useEffect(() => {
    if (!showAd) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showAd, countdown])

  const openAd = () => {
    if (remaining <= 0) {
      toast('Daily limit reached, come back tomorrow')
      return
    }
    setCountdown(5)
    setShowAd(true)
  }

  const claim = async () => {
    setCrediting(true)
    try {
      const res = await fetch('/api/watch-ad', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Failed')
        setShowAd(false)
        setCrediting(false)
        return
      }
      setWatched(json.watchedToday)
      toast(`+${json.earned} coins earned!`)
      // reflect new balance in the top bar coin pill if present
      window.dispatchEvent(new CustomEvent('coins-updated', { detail: json.coins }))
    } catch (e: any) {
      toast(e.message || 'Network error')
    }
    setShowAd(false)
    setCrediting(false)
  }

  if (!enabled) return null

  return (
    <>
      <button
        onClick={openAd}
        className="w-full mx-0 p-4 rounded-2xl flex items-center justify-between border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent active:scale-[0.98] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
            <Gift size={20} className="text-brand-gold" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">Watch an ad, earn {rewardCoins} coins</div>
            <div className="text-[11px] opacity-60">
              {remaining} of {dailyLimit} left today
            </div>
          </div>
        </div>
        <div className="text-xs font-bold text-brand-gold flex items-center gap-1">
          <Play size={12} className="fill-brand-gold" /> Free
        </div>
      </button>

      {showAd && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center px-8">
          {/* Simulated ad. Replace this block with your ad network's rewarded-video player. */}
          <div className="absolute top-4 right-4 text-xs opacity-50">
            {countdown > 0 ? `Ad · ${countdown}s` : 'Ad finished'}
          </div>
          <div className="w-full max-w-sm aspect-video rounded-2xl bg-gradient-to-br from-purple-900 via-brand-pink/40 to-brand-orange/40 flex flex-col items-center justify-center mb-8">
            <div className="text-5xl mb-3">📺</div>
            <div className="text-sm opacity-80">Advertisement</div>
            <div className="text-xs opacity-50 mt-1">(demo placeholder)</div>
          </div>

          {countdown > 0 ? (
            <div className="text-center">
              <div className="text-3xl font-black mb-1">{countdown}</div>
              <div className="text-sm opacity-60">Watch to earn {rewardCoins} coins</div>
            </div>
          ) : (
            <button
              onClick={claim}
              disabled={crediting}
              className="bg-brand-gradient px-8 py-3.5 rounded-full font-bold text-base disabled:opacity-60"
            >
              {crediting ? 'Claiming...' : `Claim ${rewardCoins} coins`}
            </button>
          )}
        </div>
      )}
    </>
  )
}
