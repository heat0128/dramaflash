'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CoinPack, SubscriptionPlan } from '@/lib/types'

type NumberInputProps = {
  label: string
  v: number
  step?: string
  onChange: (value: number) => void
  onBlur: () => void
}

type TextInputProps = {
  label: string
  v: string
  onChange: (value: string) => void
  onBlur: () => void
}

export function PricingEditor({
  packs: initPacks,
  plans: initPlans
}: {
  packs: CoinPack[]
  plans: SubscriptionPlan[]
}) {
  const [packs, setPacks] = useState(initPacks)
  const [plans, setPlans] = useState(initPlans)
  const [msg, setMsg] = useState('')

  const savePack = async (id: string, fields: Partial<CoinPack>) => {
    const supabase = createClient()
    await supabase.from('coin_packs').update(fields).eq('id', id)
    setMsg('Saved ✓')
    setTimeout(() => setMsg(''), 1500)
  }
  const savePlan = async (id: string, fields: Partial<SubscriptionPlan>) => {
    const supabase = createClient()
    await supabase.from('subscription_plans').update(fields).eq('id', id)
    setMsg('Saved ✓')
    setTimeout(() => setMsg(''), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Pricing</h1>
        {msg && <span className="text-sm text-green-400">{msg}</span>}
      </div>
      <p className="text-xs opacity-60 -mt-3">
        Change coins, bonus, and prices here. Remember to also create matching prices in your
        payment provider when you connect payments later.
      </p>

      <section>
        <h2 className="font-bold mb-3">Coin Packs</h2>
        <div className="space-y-2">
          {packs.map((p, i) => (
            <div
              key={p.id}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-2 items-end"
            >
              <Num
                label="Coins"
                v={p.coins}
                onChange={(v) => {
                  const n = [...packs]
                  n[i].coins = v
                  setPacks(n)
                }}
                onBlur={() => savePack(p.id, { coins: p.coins })}
              />
              <Num
                label="Bonus"
                v={p.bonus_coins}
                onChange={(v) => {
                  const n = [...packs]
                  n[i].bonus_coins = v
                  setPacks(n)
                }}
                onBlur={() => savePack(p.id, { bonus_coins: p.bonus_coins })}
              />
              <Num
                label="Price $"
                v={p.price_usd}
                step="0.01"
                onChange={(v) => {
                  const n = [...packs]
                  n[i].price_usd = v
                  setPacks(n)
                }}
                onBlur={() => savePack(p.id, { price_usd: p.price_usd })}
              />
              <Txt
                label="Label"
                v={p.label || ''}
                onChange={(v) => {
                  const n = [...packs]
                  n[i].label = v
                  setPacks(n)
                }}
                onBlur={() => savePack(p.id, { label: p.label || null })}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-3">VIP Plans</h2>
        <div className="space-y-2">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-2 items-end"
            >
              <Txt
                label="Name"
                v={p.name}
                onChange={(v) => {
                  const n = [...plans]
                  n[i].name = v
                  setPlans(n)
                }}
                onBlur={() => savePlan(p.id, { name: p.name })}
              />
              <Num
                label="Days"
                v={p.duration_days}
                onChange={(v) => {
                  const n = [...plans]
                  n[i].duration_days = v
                  setPlans(n)
                }}
                onBlur={() => savePlan(p.id, { duration_days: p.duration_days })}
              />
              <Num
                label="Coins inc."
                v={p.coins_included}
                onChange={(v) => {
                  const n = [...plans]
                  n[i].coins_included = v
                  setPlans(n)
                }}
                onBlur={() => savePlan(p.id, { coins_included: p.coins_included })}
              />
              <Num
                label="Price $"
                v={p.price_usd}
                step="0.01"
                onChange={(v) => {
                  const n = [...plans]
                  n[i].price_usd = v
                  setPlans(n)
                }}
                onBlur={() => savePlan(p.id, { price_usd: p.price_usd })}
              />
            </div>
          ))}
        </div>
      </section>

      <style>{`.pi{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;font-size:13px;color:white;outline:none}`}</style>
    </div>
  )
}

function Num({ label, v, step, onChange, onBlur }: NumberInputProps) {
  return (
    <label className="block">
      <span className="text-[10px] opacity-60 block mb-1">{label}</span>
      <input
        type="number"
        step={step || '1'}
        value={v}
        className="pi"
        onChange={(e) =>
          onChange(step ? parseFloat(e.target.value) : parseInt(e.target.value || '0'))
        }
        onBlur={onBlur}
      />
    </label>
  )
}
function Txt({ label, v, onChange, onBlur }: TextInputProps) {
  return (
    <label className="block">
      <span className="text-[10px] opacity-60 block mb-1">{label}</span>
      <input
        type="text"
        value={v}
        className="pi"
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </label>
  )
}
