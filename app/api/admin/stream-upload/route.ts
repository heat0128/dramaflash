import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { createStreamUpload } from '@/lib/cloudflare/stream'
import type { AspectRatio } from '@/lib/types'

export const runtime = 'nodejs'
const ASPECT_RATIOS = new Set<AspectRatio>(['9:16', '16:9', '1:1', 'OTHER'])

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body = (await request.json()) as {
      episodeId?: string
      fileSize?: number
      maxDurationSeconds?: number
      language?: string
      aspectRatio?: AspectRatio
    }
    if (!body.episodeId || !body.fileSize || body.fileSize <= 0) {
      return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
    }
    const aspectRatio = ASPECT_RATIOS.has(body.aspectRatio || '9:16')
      ? body.aspectRatio || '9:16'
      : '9:16'
    const upload = await createStreamUpload({
      fileSize: body.fileSize,
      maxDurationSeconds: Math.min(Math.max(body.maxDurationSeconds || 7200, 60), 21_600),
      creator: admin.id,
      allowedOrigin: new URL(request.url).host
    })

    const service = createServiceClient()
    const { data: asset, error } = await service
      .from('video_assets')
      .insert({
        episode_id: body.episodeId,
        provider: 'CLOUDFLARE_STREAM',
        provider_asset_id: upload.uid,
        playback_id: upload.uid,
        language: body.language || 'en',
        type: 'FULL_VIDEO',
        status: 'UPLOADING',
        aspect_ratio: aspectRatio,
        signed_playback_required: true
      })
      .select('id')
      .single()
    if (error) throw error

    await service
      .from('episodes')
      .update({
        video_url: `cloudflare:${upload.uid}`,
        aspect_ratio: aspectRatio,
        status: 'PROCESSING'
      })
      .eq('id', body.episodeId)

    return NextResponse.json({
      assetId: asset.id,
      uploadURL: upload.uploadURL,
      protocol: upload.protocol,
      uid: upload.uid
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create upload' },
      { status: 500 }
    )
  }
}
