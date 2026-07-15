import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { PUBLIC_LANGUAGES } from '@/lib/languages'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bingego.app'
  const service = createServiceClient()
  const { data } = await service
    .from('series')
    .select('id,updated_at')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(5000)

  const staticRoutes = PUBLIC_LANGUAGES.flatMap((language) =>
    ['', '/discover'].map((path) => ({
      url: `${siteUrl}/${language.code}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: path ? 0.8 : 1
    }))
  )
  const seriesRoutes = (data || []).flatMap((series) =>
    PUBLIC_LANGUAGES.map((language) => ({
      url: `${siteUrl}/${language.code}/series/${series.id}`,
      lastModified: new Date(series.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }))
  )
  return [...staticRoutes, ...seriesRoutes]
}
