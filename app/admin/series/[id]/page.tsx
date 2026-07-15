import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SeriesEditor } from './editor'

export const dynamic = 'force-dynamic'

export default async function AdminSeriesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const svc = createServiceClient()
  const { data: series } = await svc.from('series').select('*').eq('id', id).single()
  if (!series) notFound()
  const { data: episodes } = await svc
    .from('episodes')
    .select('*')
    .eq('series_id', id)
    .order('episode_number')
  return <SeriesEditor series={series} episodes={episodes || []} />
}
