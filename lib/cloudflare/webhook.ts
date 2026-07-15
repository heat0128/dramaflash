import { createHmac, timingSafeEqual } from 'crypto'

const MAX_CLOCK_SKEW_SECONDS = 5 * 60

export function verifyStreamWebhook(body: string, signatureHeader: string | null) {
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const values = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key?.trim(), value?.trim()]
    })
  )
  const timestamp = Number(values.time)
  const signature = values.sig1
  if (!timestamp || !signature) return false
  if (Math.abs(Date.now() / 1000 - timestamp) > MAX_CLOCK_SKEW_SECONDS) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  )
}
