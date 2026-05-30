'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewSeriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setErr('')
    const fd = new FormData(e.currentTarget)
    const supabase = createClient()

    let coverUrl = ''
    let verticalUrl = ''
    const cover = fd.get('cover') as File | null
    const vertical = fd.get('vertical_cover') as File | null

    if (cover && cover.size > 0) {
      const path = `series-${Date.now()}-cover-${cover.name.replace(/\s+/g,'_')}`
      const { error, data } = await supabase.storage.from('covers').upload(path, cover)
      if (error) { setErr(error.message); setLoading(false); return }
      coverUrl = supabase.storage.from('covers').getPublicUrl(data.path).data.publicUrl
    }
    if (vertical && vertical.size > 0) {
      const path = `series-${Date.now()}-vert-${vertical.name.replace(/\s+/g,'_')}`
      const { error, data } = await supabase.storage.from('covers').upload(path, vertical)
      if (error) { setErr(error.message); setLoading(false); return }
      verticalUrl = supabase.storage.from('covers').getPublicUrl(data.path).data.publicUrl
    }

    const tags = String(fd.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)

    const { data: series, error } = await supabase.from('series').insert({
      title: fd.get('title'),
      description: fd.get('description'),
      category: fd.get('category'),
      tags,
      total_episodes: 0,
      free_episodes: Number(fd.get('free_episodes')) || 2,
      coin_price: Number(fd.get('coin_price')) || 30,
      cover_url: coverUrl || null,
      vertical_cover_url: verticalUrl || null,
      is_published: false
    }).select().single()

    if (error) { setErr(error.message); setLoading(false); return }
    router.push(`/admin/series/${series.id}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">New Series</h1>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title *">
          <input name="title" required className="input"/>
        </Field>
        <Field label="Description">
          <textarea name="description" rows={4} className="input"/>
        </Field>
        <Field label="Category">
          <input name="category" placeholder="e.g. Romance, Revenge, CEO" className="input"/>
        </Field>
        <Field label="Tags (comma separated)">
          <input name="tags" placeholder="billionaire, twist, drama" className="input"/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Free episodes">
            <input type="number" name="free_episodes" defaultValue="2" className="input"/>
          </Field>
          <Field label="Coin price / ep">
            <input type="number" name="coin_price" defaultValue="30" className="input"/>
          </Field>
        </div>
        <Field label="Cover image (16:9)">
          <input type="file" name="cover" accept="image/*" className="input"/>
        </Field>
        <Field label="Vertical poster (2:3)">
          <input type="file" name="vertical_cover" accept="image/*" className="input"/>
        </Field>

        {err && <div className="text-brand-orange text-sm">{err}</div>}
        <button disabled={loading} className="w-full bg-brand-gradient py-3.5 rounded-xl font-bold disabled:opacity-60">
          {loading ? 'Creating...' : 'Create Series'}
        </button>
      </form>

      <style>{`.input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px 14px; font-size:14px; color:white; outline:none; }`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold opacity-70 mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
