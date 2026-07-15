import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { type, itemId } = await req.json()
    if (!type || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const supabase = createClient()
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

    const svc = createServiceClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    let lineItem: any
    let metadata: Record<string, string> = { userId: authUser.id, type, itemId }
    let mode: 'payment' | 'subscription' = 'payment'

    if (type === 'coin_pack') {
      const { data: pack } = await svc.from('coin_packs').select('*').eq('id', itemId).single()
      if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
      metadata.coins = String(pack.coins + pack.bonus_coins)
      lineItem = {
        price_data: {
          currency: 'usd',
          product_data: { name: `${pack.coins + pack.bonus_coins} Coins` },
          unit_amount: Math.round(Number(pack.price_usd) * 100)
        },
        quantity: 1
      }
    } else if (type === 'subscription') {
      const { data: plan } = await svc
        .from('subscription_plans')
        .select('*')
        .eq('id', itemId)
        .single()
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      metadata.durationDays = String(plan.duration_days)
      metadata.coinsIncluded = String(plan.coins_included)
      // Using one-time payment (not recurring) for simplicity. To make it recurring,
      // create Stripe Products/Prices and set mode='subscription' with price: plan.stripe_price_id
      lineItem = {
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: Math.round(Number(plan.price_usd) * 100)
        },
        quantity: 1
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      // Apple Pay and Google Pay are auto-enabled on Stripe-hosted checkout when domain is verified
      customer_email: authUser.email,
      line_items: [lineItem],
      success_url: `${siteUrl}/wallet?success=1`,
      cancel_url: `${siteUrl}/wallet?canceled=1`,
      metadata,
      allow_promotion_codes: true
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Checkout error:', e)
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 })
  }
}
