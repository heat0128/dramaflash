'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Series, Episode, AspectRatio } from '@/lib/types'
import { Trash2, Upload, Captions } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'
import { SubtitleManager } from '@/components/subtitle-manager'
import { uploadToStream } from '@/lib/cloudflare/upload-client'

export function SeriesEditor({
  series: initialSeries,
  episodes: initialEpisodes
}: {
  series: Series
  episodes: Episode[]
}) {
  const router = useRouter()
  const [series, setSeries] = useState(initialSeries)
  const [episodes, setEpisodes] = useState(initialEpisodes)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [msg, setMsg] = useState('')
  const [openSubs, setOpenSubs] = useState<string | null>(null)

  const togglePublish = async () => {
    const supabase = createClient()
    const next = !series.is_published
    await supabase.from('series').update({ is_published: next }).eq('id', series.id)
    setSeries({ ...series, is_published: next })
    setMsg(next ? 'Published live' : 'Unpublished')
  }

  const toggleFeatured = async () => {
    const supabase = createClient()
    const next = !series.is_featured
    await supabase.from('series').update({ is_featured: next }).eq('id', series.id)
    setSeries({ ...series, is_featured: next })
    setMsg(next ? 'Added to Recommended' : 'Removed from Recommended')
  }

  const updateField = async (field: keyof Series, value: any) => {
    const supabase = createClient()
    await supabase
      .from('series')
      .update({ [field]: value })
      .eq('id', series.id)
    setSeries({ ...series, [field]: value })
  }

  const uploadEpisode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setUploadProgress(0)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const file = fd.get('video') as File
    const externalUrl = String(fd.get('video_url') || '').trim()
    if ((!file || file.size === 0) && !externalUrl) {
      setMsg('Upload a video file or paste a video URL')
      setUploading(false)
      return
    }

    const supabase = createClient()
    const epNumber = Number(fd.get('episode_number'))
    const aspectRatio = String(fd.get('aspect_ratio') || '9:16') as AspectRatio

    // Optionally upload thumbnail (auto-compressed to vertical 9:16)
    let thumbUrl: string | null = null
    const thumb = fd.get('thumbnail') as File | null
    if (thumb && thumb.size > 0) {
      try {
        const tblob = await compressImage(thumb, {
          aspect: aspectRatio === '16:9' ? 16 / 9 : 9 / 16,
          maxWidth: aspectRatio === '16:9' ? 1280 : 720,
          quality: 0.82
        })
        const thumbPath = `series-${series.id}/thumb-ep-${epNumber}-${Date.now()}.jpg`
        const { data: tdata } = await supabase.storage
          .from('covers')
          .upload(thumbPath, tblob, { contentType: 'image/jpeg' })
        if (tdata)
          thumbUrl = supabase.storage.from('covers').getPublicUrl(tdata.path).data.publicUrl
      } catch {
        /* thumbnail is optional; ignore failures */
      }
    }

    const { data: ep, error: insErr } = await supabase
      .from('episodes')
      .insert({
        series_id: series.id,
        episode_number: epNumber,
        title: (fd.get('title') as string) || null,
        description: (fd.get('description') as string) || null,
        video_url: externalUrl || 'pending:cloudflare-stream',
        thumbnail_url: thumbUrl,
        duration_seconds: Number(fd.get('duration_seconds')) || null,
        is_free: fd.get('is_free') === 'on',
        aspect_ratio: aspectRatio,
        status: file?.size ? 'PROCESSING' : 'PUBLISHED'
      })
      .select()
      .single()

    if (insErr) {
      setMsg('Save failed: ' + insErr.message)
      setUploading(false)
      return
    }

    if (file && file.size > 0) {
      try {
        const uploadResponse = await fetch('/api/admin/stream-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: ep.id,
            fileSize: file.size,
            maxDurationSeconds: Number(fd.get('duration_seconds')) || 7200,
            language: series.original_language || 'en',
            aspectRatio
          })
        })
        const upload = (await uploadResponse.json()) as {
          error?: string
          uploadURL?: string
          protocol?: 'basic' | 'tus'
          uid?: string
        }
        if (!uploadResponse.ok || !upload.uploadURL || !upload.protocol) {
          throw new Error(upload.error || 'Unable to create Cloudflare upload')
        }
        await uploadToStream({
          file,
          uploadURL: upload.uploadURL,
          protocol: upload.protocol,
          onProgress: setUploadProgress
        })
        ep.video_url = `cloudflare:${upload.uid}`
        ep.status = 'PROCESSING'
      } catch (error) {
        setMsg(error instanceof Error ? error.message : 'Video upload failed')
        setUploading(false)
        return
      }
    }

    // Update series total
    const newTotal = Math.max(series.total_episodes, epNumber)
    await supabase.from('series').update({ total_episodes: newTotal }).eq('id', series.id)
    setSeries({ ...series, total_episodes: newTotal })
    setEpisodes([...episodes, ep].sort((a, b) => a.episode_number - b.episode_number))
    setMsg('Episode saved')
    setUploading(false)
    ;(e.target as HTMLFormElement).reset()
  }

  const deleteEpisode = async (epId: string) => {
    if (!confirm('Delete this episode?')) return
    const supabase = createClient()
    await supabase.from('episodes').delete().eq('id', epId)
    setEpisodes(episodes.filter((ep) => ep.id !== epId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-extrabold">{series.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFeatured}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              series.is_featured ? 'bg-brand-gold text-black' : 'bg-white/10'
            }`}
          >
            {series.is_featured ? 'Recommended' : 'Recommend'}
          </button>
          <button
            onClick={togglePublish}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              series.is_published ? 'bg-green-600' : 'bg-white/10'
            }`}
          >
            {series.is_published ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      {msg && <div className="text-sm text-brand-orange">{msg}</div>}

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3">
        <h2 className="font-bold mb-2">Series Settings</h2>
        <Inline label="Title" value={series.title} onSave={(v) => updateField('title', v)} />
        <Inline
          label="Description"
          value={series.description || ''}
          onSave={(v) => updateField('description', v)}
          multiline
        />
        <Inline
          label="Category"
          value={series.category || ''}
          onSave={(v) => updateField('category', v)}
        />
        <Inline
          label="Free episodes"
          value={String(series.free_episodes)}
          onSave={(v) => updateField('free_episodes', parseInt(v) || 0)}
        />
        <Inline
          label="Coin price per episode"
          value={String(series.coin_price)}
          onSave={(v) => updateField('coin_price', parseInt(v) || 0)}
        />
      </div>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
        <h2 className="font-bold mb-4">Add Episode</h2>
        <form onSubmit={uploadEpisode} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              name="episode_number"
              type="number"
              required
              min="1"
              defaultValue={episodes.length + 1}
              placeholder="Ep #"
              className="input"
            />
            <input
              name="duration_seconds"
              type="number"
              placeholder="Duration (sec)"
              className="input col-span-2"
            />
          </div>
          <input name="title" placeholder="Episode title (optional)" className="input" />
          <textarea
            name="description"
            placeholder="Episode description"
            rows={2}
            className="input"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_free" /> Mark this episode as free
          </label>
          <label className="block">
            <span className="text-xs opacity-60 block mb-1">Video aspect ratio</span>
            <select name="aspect_ratio" defaultValue="9:16" className="input">
              <option value="9:16">9:16 — Vertical short drama</option>
              <option value="16:9">16:9 — Landscape video</option>
              <option value="1:1">1:1 — Square</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <div>
            <span className="text-xs opacity-60 block mb-1">
              Video URL (YouTube, Dailymotion, .m3u8, or MP4)
            </span>
            <input name="video_url" type="url" placeholder="https://..." className="input" />
          </div>
          <div>
            <span className="text-xs opacity-60 block mb-1">
              Or upload directly to Cloudflare Stream (resumable for large files)
            </span>
            <input type="file" name="video" accept="video/*" className="input" />
          </div>
          <div>
            <span className="text-xs opacity-60 block mb-1">Thumbnail (optional)</span>
            <input type="file" name="thumbnail" accept="image/*" className="input" />
          </div>
          {uploading && (
            <div className="text-sm text-brand-orange flex items-center gap-2">
              <Upload size={14} className="animate-pulse" /> Uploading... {uploadProgress}%
            </div>
          )}
          <button
            disabled={uploading}
            className="w-full bg-brand-gradient py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload Episode'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold mb-3">Episodes ({episodes.length})</h2>
        <div className="space-y-2">
          {episodes.map((ep) => (
            <div key={ep.id} className="bg-white/[0.04] p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">
                    Ep {ep.episode_number}
                    {ep.is_free && ' - Free'}
                    {ep.title && `: ${ep.title}`}
                  </div>
                  <div className="text-xs opacity-50 truncate max-w-[200px]">{ep.video_url}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOpenSubs(openSubs === ep.id ? null : ep.id)}
                    className={`p-2 rounded-lg ${openSubs === ep.id ? 'bg-brand-pink/20 text-brand-pink' : 'text-white/60'}`}
                    title="Subtitles"
                  >
                    <Captions size={16} />
                  </button>
                  <button onClick={() => deleteEpisode(ep.id)} className="text-red-400 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {openSubs === ep.id && <SubtitleManager episodeId={ep.id} />}
            </div>
          ))}
        </div>
      </div>

      <style>{`.input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 12px; font-size:13px; color:white; outline:none; }`}</style>
    </div>
  )
}

function Inline({
  label,
  value,
  onSave,
  multiline
}: {
  label: string
  value: string
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const [v, setV] = useState(value)
  const [dirty, setDirty] = useState(false)
  return (
    <div>
      <div className="text-xs opacity-60 mb-1">{label}</div>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={v}
            rows={3}
            onChange={(e) => {
              setV(e.target.value)
              setDirty(true)
            }}
            className="input"
          />
        ) : (
          <input
            value={v}
            onChange={(e) => {
              setV(e.target.value)
              setDirty(true)
            }}
            className="input"
          />
        )}
        {dirty && (
          <button
            onClick={() => {
              onSave(v)
              setDirty(false)
            }}
            className="bg-brand-gradient px-3 rounded-lg text-xs font-bold"
          >
            Save
          </button>
        )}
      </div>
    </div>
  )
}
