'use client'

import Link from 'next/link'
import { Play, ChevronRight } from 'lucide-react'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import type { Series } from '@/lib/types'
import type { ContinueWatchingItem } from '@/app/(main)/page'

const CATEGORIES = [
  'romance',
  'billionaire',
  'comedy',
  'revenge',
  'mafia',
  'fantasy',
  'werewolf',
  'family',
  'christian',
  'drama'
] as const

export function CatalogHome({
  continueWatching,
  trending,
  newReleases,
  popular,
  recommended,
  latest
}: {
  continueWatching: ContinueWatchingItem[]
  trending: Series[]
  newReleases: Series[]
  popular: Series[]
  recommended: Series[]
  latest: Series[]
}) {
  const { t } = useI18n()
  const sections: { key: TranslationKey; items: Series[] }[] = [
    { key: 'home.trending', items: trending },
    { key: 'home.new', items: newReleases },
    { key: 'home.popular', items: popular },
    { key: 'home.recommended', items: recommended },
    { key: 'home.latest', items: latest }
  ]
  const hero = recommended[0] || trending[0] || newReleases[0]

  return (
    <main className="min-h-screen pb-28 pt-[72px]">
      {hero && <Hero series={hero} />}

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/discover/${category}`}
            className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold"
          >
            {t(`category.${category}`)}
          </Link>
        ))}
      </div>

      {continueWatching.length > 0 && (
        <section className="mb-6">
          <SectionTitle title={t('home.continueWatching')} />
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
            {continueWatching.map((item) => (
              <ContinueCard key={item.episodeId} item={item} />
            ))}
          </div>
        </section>
      )}

      {sections.map((section) =>
        section.items.length > 0 ? (
          <SeriesRail key={section.key} title={t(section.key)} items={section.items} />
        ) : null
      )}

      {!hero && <EmptyState text={t('home.noDramas')} />}
    </main>
  )
}

function Hero({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.id}`}
      className="relative mx-4 block aspect-[16/10] overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-900 to-slate-950"
    >
      {(series.cover_url || series.vertical_cover_url) && (
        <img
          src={series.cover_url || series.vertical_cover_url || ''}
          alt={series.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-orange">
          Featured Story
        </div>
        <h1 className="line-clamp-2 text-2xl font-black leading-tight">{series.title}</h1>
        <p className="mt-2 line-clamp-2 max-w-[85%] text-xs leading-relaxed text-white/75">
          {series.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-black">
          <Play size={14} fill="currentColor" /> Watch now
        </span>
      </div>
    </Link>
  )
}

function SeriesRail({ title, items }: { title: string; items: Series[] }) {
  return (
    <section className="mb-6">
      <SectionTitle title={title} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((series) => (
          <div key={series.id} className="w-[132px] flex-none">
            <SeriesCard series={series} />
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-4">
      <h2 className="text-lg font-black">{title}</h2>
      <ChevronRight size={18} className="text-white/35" />
    </div>
  )
}

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link href={`/series/${series.id}`} className="block min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/[0.06]">
        {(series.vertical_cover_url || series.cover_url) && (
          <img
            src={series.vertical_cover_url || series.cover_url || ''}
            alt={series.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[9px] font-bold backdrop-blur">
          {series.total_episodes} EP
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-snug">{series.title}</h3>
    </Link>
  )
}

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
  const percentage = item.durationSeconds
    ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
    : 0
  return (
    <Link href={`/watch/${item.episodeId}`} className="w-[220px] flex-none">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/[0.06]">
        {(item.series.cover_url || item.series.vertical_cover_url) && (
          <img
            src={item.series.cover_url || item.series.vertical_cover_url || ''}
            alt={item.series.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
            <Play size={16} fill="currentColor" />
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div className="h-full bg-brand-pink" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold">{item.series.title}</span>
        <span className="flex-none text-[10px] text-white/45">EP {item.episodeNumber}</span>
      </div>
    </Link>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-8 py-28 text-center text-sm text-white/50">{text}</div>
}
