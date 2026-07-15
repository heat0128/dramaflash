import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyStreamWebhook } from '@/lib/cloudflare/webhook'

export const runtime = 'nodejs'

type StreamWebhook = {
  uid: string
  readyToStream?: boolean
  thumbnail?: string
  duration?: number
  status?: { state?: string; errorReasonText?: string }
  input?: { width?: number; height?: number }
  meta?: Record<string, unknown>
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyStreamWebhook(rawBody, request.headers.get('webhook-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as StreamWebhook
  if (!payload.uid) return NextResponse.json({ error: 'Missing video uid' }, { status: 400 })

  const width = payload.input?.width || null
  const height = payload.input?.height || null
  const aspectRatio = width && height && width > height ? '16:9' : '9:16'
  const status = payload.readyToStream
    ? 'READY'
    : payload.status?.state === 'error'
      ? 'ERROR'
      : 'PROCESSING'
  const service = createServiceClient()
  const { data: asset, error } = await service
    .from('video_assets')
    .update({
      status,
      width,
      height,
      aspect_ratio: aspectRatio,
      duration_seconds: payload.duration || null,
      thumbnail_url: payload.thumbnail || null,
      processing_error: payload.status?.errorReasonText || null,
      metadata: payload.meta || {}
    })
    .eq('provider', 'CLOUDFLARE_STREAM')
    .eq('provider_asset_id', payload.uid)
    .select('episode_id')
    .maybeSingle()
  if (error) throw error

  if (asset?.episode_id) {
    await service
      .from('episodes')
      .update({
        status: status === 'READY' ? 'PUBLISHED' : status,
        aspect_ratio: aspectRatio,
        duration_seconds: payload.duration ? Math.round(payload.duration) : null,
        thumbnail_url: payload.thumbnail || undefined
      })
      .eq('id', asset.episode_id)
  }
  return NextResponse.json({ ok: true })
}
