import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import {
  DEFAULT_EPISODE_PRICE_USD,
  DEFAULT_SEASON_PRICE_USD,
  SUPPORTED_CURRENCIES,
  toMinorUnits,
  type CheckoutType
} from '@/lib/commerce'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: CheckoutType
      itemId?: string
      couponCode?: string
      currency?: string
      idempotencyKey?: string
    }
    if (!body.type || !body.itemId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

    const service = createServiceClient()
    const currency = SUPPORTED_CURRENCIES.has((body.currency || '').toUpperCase())
      ? (body.currency || 'USD').toUpperCase()
      : 'USD'
    const idempotencyKey = body.idempotencyKey || crypto.randomUUID()
    let title = ''
    let amountUsd = 0
    let stripePriceId: string | null = null
    let mode: 'payment' | 'subscription' = 'payment'
    const metadata: Record<string, string> = {
      userId: user.id,
      type: body.type,
      itemId: body.itemId
    }

    if (body.type === 'coin_pack') {
      const { data } = await service.from('coin_packs').select('*').eq('id', body.itemId).single()
      if (!data) return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
      title = `${data.coins + data.bonus_coins} Coins`
      amountUsd = Number(data.price_usd)
      stripePriceId = data.stripe_price_id
      metadata.coins = String(data.coins + data.bonus_coins)
    } else if (body.type === 'subscription') {
      const { data } = await service
        .from('subscription_plans')
        .select('*')
        .eq('id', body.itemId)
        .single()
      if (!data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      title = data.name
      amountUsd = Number(data.price_usd)
      stripePriceId = data.stripe_price_id
      mode = stripePriceId ? 'subscription' : 'payment'
      metadata.durationDays = String(data.duration_days)
      metadata.coinsIncluded = String(data.coins_included)
    } else if (body.type === 'episode') {
      const { data } = await service
        .from('episodes')
        .select('id,title,price_usd,series_id')
        .eq('id', body.itemId)
        .single()
      if (!data) return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
      title = data.title || 'Episode access'
      amountUsd = Number(data.price_usd || DEFAULT_EPISODE_PRICE_USD)
      metadata.seriesId = data.series_id
      metadata.episodeId = data.id
    } else {
      const { data } = await service
        .from('series')
        .select('id,title,season_price_usd')
        .eq('id', body.itemId)
        .single()
      if (!data) return NextResponse.json({ error: 'Series not found' }, { status: 404 })
      title = `${data.title} · Full season`
      amountUsd = Number(data.season_price_usd || DEFAULT_SEASON_PRICE_USD)
      metadata.seriesId = data.id
    }

    let discountAmount = 0
    if (body.couponCode) {
      const now = new Date().toISOString()
      const { data: coupon } = await service
        .from('coupons')
        .select('*')
        .eq('code', body.couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .maybeSingle()
      if (!coupon) return NextResponse.json({ error: 'Invalid coupon' }, { status: 400 })
      discountAmount =
        coupon.discount_type === 'PERCENT'
          ? (amountUsd * Math.min(100, coupon.discount_value)) / 100
          : Math.min(amountUsd, coupon.discount_value / 100)
      metadata.couponId = coupon.id
    }
    const totalUsd = Math.max(0.5, amountUsd - discountAmount)
    const { data: order, error: orderError } = await service
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'PENDING',
        currency,
        subtotal_amount: toMinorUnits(amountUsd, currency),
        discount_amount: toMinorUnits(discountAmount, currency),
        total_amount: toMinorUnits(totalUsd, currency),
        idempotency_key: idempotencyKey,
        metadata
      })
      .select('id')
      .single()
    if (orderError) throw orderError
    metadata.orderId = order.id

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const lineItem = stripePriceId
      ? { price: stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: title },
            unit_amount: toMinorUnits(totalUsd, currency)
          },
          quantity: 1
        }
    const session = await stripe.checkout.sessions.create(
      {
        mode,
        customer_email: user.email,
        line_items: [lineItem],
        success_url: `${siteUrl}/wallet?success=1`,
        cancel_url: `${siteUrl}/wallet?canceled=1`,
        metadata,
        allow_promotion_codes: !body.couponCode
      },
      { idempotencyKey }
    )
    await service.from('orders').update({ provider_order_id: session.id }).eq('id', order.id)
    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
