import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `Bad signature: ${e.message}` }, { status: 400 })
  }

  const svc = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const md = session.metadata || {}
    const userId = md.userId
    if (!userId) return NextResponse.json({ ok: true })

    // Idempotency check
    const { data: existingTx } = await svc
      .from('transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (existingTx) return NextResponse.json({ ok: true, duplicate: true })

    const { data: profile } = await svc.from('profiles').select('*').eq('id', userId).single()
    if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const amountUsd = (session.amount_total || 0) / 100

    if (md.type === 'coin_pack') {
      const coins = parseInt(md.coins || '0', 10)
      await svc
        .from('profiles')
        .update({ coins: profile.coins + coins })
        .eq('id', userId)
      await svc.from('transactions').insert({
        user_id: userId,
        type: 'coin_pack',
        amount_usd: amountUsd,
        coins_added: coins,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        status: 'succeeded',
        metadata: md as any
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
          vip_expires_at: newExpiry.toISOString(),
          coins: profile.coins + includedCoins
        })
        .eq('id', userId)
      await svc.from('transactions').insert({
        user_id: userId,
        type: 'subscription',
        amount_usd: amountUsd,
        coins_added: includedCoins,
        vip_days_added: days,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        status: 'succeeded',
        metadata: md as any
      })
    }
  }

  return NextResponse.json({ received: true })
}
