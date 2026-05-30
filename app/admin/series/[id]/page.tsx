import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SeriesEditor } from './editor'

export const dynamic = 'force-dynamic'

export default async function AdminSeriesEditPage({ params }: { params: { id: string } }) {
  const svc = createServiceClient()
  const { data: series } = await svc.from('series').select('*').eq('id', params.id).single()
  if (!series) notFound()
  const { data: episodes } = await svc.from('episodes').select('*')
    .eq('series_id', params.id).order('episode_number')
  return <SeriesEditor series={series} episodes={episodes || []} />
}
