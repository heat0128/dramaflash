const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'
const BASIC_UPLOAD_LIMIT = 200 * 1024 * 1024

type CloudflareEnvelope<T> = {
  success: boolean
  result: T
  errors?: { message: string }[]
}

function streamConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE
  if (!accountId || !apiToken) throw new Error('Cloudflare Stream is not configured')
  return { accountId, apiToken, customerCode }
}

async function cloudflareRequest<T>(path: string, init: RequestInit = {}) {
  const { accountId, apiToken } = streamConfig()
  const response = await fetch(`${CLOUDFLARE_API}/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...init.headers
    },
    cache: 'no-store'
  })
  const body = (await response.json()) as CloudflareEnvelope<T>
  if (!response.ok || !body.success) {
    throw new Error(
      body.errors?.map((error) => error.message).join(', ') || 'Cloudflare request failed'
    )
  }
  return body.result
}

export async function createStreamUpload({
  fileSize,
  maxDurationSeconds,
  creator,
  allowedOrigin
}: {
  fileSize: number
  maxDurationSeconds: number
  creator: string
  allowedOrigin?: string
}) {
  if (fileSize <= BASIC_UPLOAD_LIMIT) {
    const result = await cloudflareRequest<{ uid: string; uploadURL: string }>(
      '/stream/direct_upload',
      {
        method: 'POST',
        body: JSON.stringify({
          maxDurationSeconds,
          creator,
          requireSignedURLs: true,
          ...(allowedOrigin ? { allowedOrigins: [allowedOrigin] } : {})
        })
      }
    )
    return { ...result, protocol: 'basic' as const }
  }

  const { accountId, apiToken } = streamConfig()
  const metadata = [
    ['maxDurationSeconds', String(maxDurationSeconds)],
    ['requiresignedurls', 'true'],
    ['creator', creator]
  ]
    .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
    .join(',')
  const response = await fetch(`${CLOUDFLARE_API}/accounts/${accountId}/stream?direct_user=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(fileSize),
      'Upload-Metadata': metadata
    },
    cache: 'no-store'
  })
  const uploadURL = response.headers.get('location')
  const uid = response.headers.get('stream-media-id') || uploadURL?.split('/').pop()
  if (!response.ok || !uploadURL || !uid) throw new Error('Unable to create resumable upload')
  return { uid, uploadURL, protocol: 'tus' as const }
}

export async function createStreamToken(videoUid: string) {
  return cloudflareRequest<{ token: string }>(`/stream/${videoUid}/token`, {
    method: 'POST',
    body: JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 15 * 60 })
  })
}

export function streamHlsUrl(tokenOrUid: string) {
  const { customerCode } = streamConfig()
  if (!customerCode) throw new Error('Cloudflare Stream customer code is not configured')
  return `https://customer-${customerCode}.cloudflarestream.com/${tokenOrUid}/manifest/video.m3u8`
}
