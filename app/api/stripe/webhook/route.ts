import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `Bad signature: ${e.message}` }, { status: 400 })
  }

  const svc = createServiceClient()
  const { error: eventError } = await svc.from('webhook_events').insert({
    provider: 'STRIPE',
    event_id: event.id,
    event_type: event.type,
    status: 'PROCESSING',
    payload: event as unknown as Record<string, unknown>
  })
  if (eventError?.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true })
  }
  if (eventError) throw eventError

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const md = session.metadata || {}
    const userId = md.userId
    if (!userId) return NextResponse.json({ ok: true })

    const { data: profile } = await svc.from('profiles').select('*').eq('id', userId).single()
    if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const amountUsd = (session.amount_total || 0) / 100

    if (md.type === 'coin_pack') {
      const coins = parseInt(md.coins || '0', 10)
      await svc.rpc('credit_wallet', {
        p_user_id: userId,
        p_amount: coins,
        p_entry_type: 'COIN_PURCHASE',
        p_reference_type: 'STRIPE_SESSION',
        p_reference_id: session.id,
        p_idempotency_key: event.id
      })
      await svc.from('transactions').insert({
        user_id: userId,
        type: 'coin_pack',
        amount_usd: amountUsd,
        coins_added: coins,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        status: 'succeeded',
        metadata: md
      })
    } else if (md.type === 'subscription') {
      const days = parseInt(md.durationDays || '0', 10)
      const includedCoins = parseInt(md.coinsIncluded || '0', 10)
      const now = new Date()
      const currentExpiry = profile.vip_expires_at ? new Date(profile.vip_expires_at) : now
      const baseDate = currentExpiry > now ? currentExpiry : now
      const newExpiry = new Date(baseDate.getTime() + days * 86400_000)
      await svc
        .from('profiles')
        .update({
          is_vip: true,
          vip_expires_at: newExpiry.toISOString()
        })
        .eq('id', userId)
      if (includedCoins > 0) {
        await svc.rpc('credit_wallet', {
          p_user_id: userId,
          p_amount: includedCoins,
          p_entry_type: 'VIP_BONUS',
          p_reference_type: 'STRIPE_SESSION',
          p_reference_id: session.id,
          p_idempotency_key: `${event.id}:coins`
        })
      }
      await svc.from('transactions').insert({
        user_id: userId,
        type: 'subscription',
        amount_usd: amountUsd,
        coins_added: includedCoins,
        vip_days_added: days,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        status: 'succeeded',
        metadata: md
      })
    } else if (md.type === 'episode' && md.episodeId && md.seriesId) {
      await svc.from('purchases').upsert(
        {
          user_id: userId,
          order_id: md.orderId || null,
          series_id: md.seriesId,
          episode_id: md.episodeId,
          purchase_type: 'EPISODE'
        },
        { onConflict: 'user_id,episode_id' }
      )
    } else if (md.type === 'season' && md.seriesId) {
      await svc.from('purchases').insert({
        user_id: userId,
        order_id: md.orderId || null,
        series_id: md.seriesId,
        purchase_type: 'SEASON'
      })
    }

    if (md.orderId) {
      await svc.from('orders').update({ status: 'PAID' }).eq('id', md.orderId)
    }
  }

  await svc
    .from('webhook_events')
    .update({
      status: 'PROCESSED',
      processed_at: new Date().toISOString()
    })
    .eq('provider', 'STRIPE')
    .eq('event_id', event.id)

  return NextResponse.json({ received: true })
}
