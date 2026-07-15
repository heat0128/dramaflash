import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { seriesId } = await req.json()
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  await supabase.from('favorites').upsert({ user_id: user.id, series_id: seriesId })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { seriesId } = await req.json()
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  await supabase.from('favorites').delete().eq('user_id', user.id).eq('series_id', seriesId)
  return NextResponse.json({ ok: true })
}
