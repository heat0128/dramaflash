'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LANGUAGES, langLabel } from '@/lib/languages'
import { srtToVtt } from '@/lib/srt-to-vtt'
import { Trash2 } from 'lucide-react'

type Subtitle = { id: string; lang: string; label: string; storage_path: string }

export function SubtitleManager({ episodeId }: { episodeId: string }) {
  const [subs, setSubs] = useState<Subtitle[]>([])
  const [lang, setLang] = useState('en')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('subtitles').select('*').eq('episode_id', episodeId)
      .then(({ data }) => setSubs((data as Subtitle[]) || []))
  }, [episodeId])

  const upload = async (file: File) => {
    setBusy(true); setMsg('')
    try {
      const supabase = createClient()
      const text = await file.text()
      // Convert .srt → .vtt (if it's already .vtt this leaves it valid too)
      const vtt = file.name.toLowerCase().endsWith('.vtt') ? text : srtToVtt(text)
      const blob = new Blob([vtt], { type: 'text/vtt' })
      const path = `${episodeId}/${lang}-${Date.now()}.vtt`

      const { data, error } = await supabase.storage.from('subtitles')
        .upload(path, blob, { contentType: 'text/vtt', upsert: true })
      if (error) { setMsg('Upload failed: ' + error.message); setBusy(false); return }

      const url = supabase.storage.from('subtitles').getPublicUrl(data.path).data.publicUrl
      const label = langLabel(lang)

      // Replace any existing subtitle for this language
      await supabase.from('subtitles').delete().eq('episode_id', episodeId).eq('lang', lang)
      const { data: row, error: insErr } = await supabase.from('subtitles').insert({
        episode_id: episodeId, lang, label, storage_path: url
      }).select().single()
      if (insErr) { setMsg('Save failed: ' + insErr.message); setBusy(false); return }

      setSubs(prev => [...prev.filter(s => s.lang !== lang), row as Subtitle])
      setMsg(`${label} subtitle added ✓`)
    } catch (e: any) {
      setMsg('Error: ' + (e.message || e))
    }
    setBusy(false)
  }

  const remove = async (sub: Subtitle) => {
    const supabase = createClient()
    await supabase.from('subtitles').delete().eq('id', sub.id)
    setSubs(prev => prev.filter(s => s.id !== sub.id))
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="text-xs font-bold opacity-70 mb-2">Subtitles ({subs.length})</div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {subs.map(s => (
          <span key={s.id} className="flex items-center gap-1 bg-white/[0.08] text-[11px] px-2 py-1 rounded-full">
            {langLabel(s.lang)}
            <button onClick={() => remove(s)} className="text-red-400"><Trash2 size={11}/></button>
          </span>
        ))}
        {subs.length === 0 && <span className="text-[11px] opacity-40">None yet</span>}
      </div>

      <div className="flex gap-2 items-center">
        <select value={lang} onChange={e => setLang(e.target.value)}
          className="bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
        <label className="bg-brand-gradient px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
          {busy ? 'Uploading...' : 'Upload .srt'}
          <input type="file" accept=".srt,.vtt" className="hidden" disabled={busy}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
        </label>
      </div>
      {msg && <div className="text-[11px] text-brand-orange mt-2">{msg}</div>}
    </div>
  )
}
