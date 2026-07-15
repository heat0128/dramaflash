'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SettingsEditor({ initial }: { initial: Record<string, string> }) {
  const [enabled, setEnabled] = useState(initial.ad_enabled === 'true')
  const [reward, setReward] = useState(initial.ad_reward_coins || '10')
  const [limit, setLimit] = useState(initial.ad_daily_limit || '5')
  const [msg, setMsg] = useState('')

  const save = async () => {
    const supabase = createClient()
    const updates = [
      { key: 'ad_enabled', value: enabled ? 'true' : 'false' },
      { key: 'ad_reward_coins', value: String(parseInt(reward) || 0) },
      { key: 'ad_daily_limit', value: String(parseInt(limit) || 0) }
    ]
    for (const u of updates) {
      await supabase.from('app_settings').update({ value: u.value }).eq('key', u.key)
    }
    setMsg('Saved ✓')
    setTimeout(() => setMsg(''), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Settings</h1>
        {msg && <span className="text-sm text-green-400">{msg}</span>}
      </div>

      <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-4">
        <h2 className="font-bold">Watch-Ad Rewards</h2>

        <label className="flex items-center justify-between">
          <span className="text-sm">Enable &quot;watch ad to earn coins&quot;</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5"
          />
        </label>

        <label className="block">
          <span className="text-xs opacity-60 block mb-1">Coins per ad</span>
          <input
            type="number"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs opacity-60 block mb-1">Max ads per user per day</span>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
          />
        </label>

        <button onClick={save} className="w-full bg-brand-gradient py-3 rounded-xl font-bold">
          Save Settings
        </button>
      </section>

      <p className="text-xs opacity-50">
        Note: the ad shown is currently a demo placeholder. Once you connect a real ad network
        (AdSense / Adsterra / PropellerAds), the reward stays the same — only the video player is
        swapped.
      </p>
    </div>
  )
}
