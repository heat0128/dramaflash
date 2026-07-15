'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Heart,
  Bookmark,
  Share2,
  List,
  Lock,
  Captions,
  Maximize,
  RotateCw,
  PictureInPicture,
  Gauge
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { langLabel } from '@/lib/languages'
import { getSavedLang } from '@/lib/i18n'
import { getVideoSource } from '@/lib/video-source'
import clsx from 'clsx'
import type { Episode, Series, AspectRatio } from '@/lib/types'

type FeedItem = {
  episode: Episode
  series: Series
  isUnlocked: boolean
}

export function VideoFeed({
  initialItems,
  initialCoins,
  isVip
}: {
  initialItems: FeedItem[]
  initialCoins: number
  isVip: boolean
}) {
  const [items, setItems] = useState(initialItems)
  const [coins, setCoins] = useState(initialCoins)
  const [activeIdx, setActiveIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const { show: toast } = useToast()

  // Auto-play visible video, pause others
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-idx'))
          const v = videoRefs.current[idx]
          if (!v) return
          if (entry.intersectionRatio > 0.7) {
            setActiveIdx(idx)
            // only auto-play if unlocked
            if (items[idx]?.isUnlocked) {
              v.play().catch(() => {
                /* user must interact first */
              })
            }
          } else {
            v.pause()
          }
        })
      },
      { threshold: [0, 0.7, 1] }
    )

    root.querySelectorAll('[data-slide]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  const playNext = useCallback(
    (idx: number) => {
      const nextIndex = idx + 1
      if (nextIndex >= items.length || !items[nextIndex]?.isUnlocked) return
      const nextSlide = containerRef.current?.querySelector(`[data-idx="${nextIndex}"]`)
      nextSlide?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [items]
  )

  const unlockWithCoin = useCallback(
    async (episodeId: string) => {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, method: 'coin' })
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Failed to unlock')
        return
      }
      setCoins(json.coins)
      setItems((prev) =>
        prev.map((it) => (it.episode.id === episodeId ? { ...it, isUnlocked: true } : it))
      )
      toast('Unlocked!')
    },
    [toast]
  )

  const unlockWithAd = useCallback(
    async (episodeId: string) => {
      toast('Loading ad...')
      // In production: integrate an ad SDK here, then call /api/unlock with method: 'ad'
      setTimeout(async () => {
        const res = await fetch('/api/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episodeId, method: 'ad' })
        })
        const json = await res.json()
        if (!res.ok) {
          toast(json.error)
          return
        }
        setItems((prev) =>
          prev.map((it) => (it.episode.id === episodeId ? { ...it, isUnlocked: true } : it))
        )
        toast('Unlocked via ad!')
      }, 1500)
    },
    [toast]
  )

  return (
    <div
      ref={containerRef}
      className="snap-feed no-scrollbar"
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'scroll',
        background: '#000'
      }}
    >
      {items.map((item, idx) => (
        <Slide
          key={item.episode.id}
          idx={idx}
          item={item}
          videoRef={(el) => {
            videoRefs.current[idx] = el
          }}
          isActive={idx === activeIdx}
          shouldLoad={Math.abs(idx - activeIdx) <= 1}
          onUnlockCoin={() => unlockWithCoin(item.episode.id)}
          onUnlockAd={() => unlockWithAd(item.episode.id)}
          onEnded={() => playNext(idx)}
          isVip={isVip}
          currentCoins={coins}
        />
      ))}
    </div>
  )
}

function Slide({
  idx,
  item,
  videoRef,
  isActive,
  shouldLoad,
  onUnlockCoin,
  onUnlockAd,
  onEnded,
  isVip,
  currentCoins
}: {
  idx: number
  item: FeedItem
  videoRef: (el: HTMLVideoElement | null) => void
  isActive: boolean
  shouldLoad: boolean
  onUnlockCoin: () => void
  onUnlockAd: () => void
  onEnded: () => void
  isVip: boolean
  currentCoins: number
}) {
  const { episode, series, isUnlocked } = item
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showPaywall, setShowPaywall] = useState(!isUnlocked)
  const [paused, setPaused] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(episode.aspect_ratio || '9:16')
  const [resumeAt, setResumeAt] = useState(0)
  const [assetId, setAssetId] = useState<string | null>(null)
  const [subs, setSubs] = useState<{ lang: string; storage_path: string }[]>([])
  const [subMenu, setSubMenu] = useState(false)
  const [activeSub, setActiveSub] = useState<string | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef(0)
  const { show: toast } = useToast()

  useEffect(() => {
    setShowPaywall(!isUnlocked)
  }, [isUnlocked])

  // Fetch a playable URL only for the current slide and the next/previous one.
  useEffect(() => {
    if (!isUnlocked || !shouldLoad || videoSrc) return
    fetch('/api/video-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodeId: episode.id })
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.url) {
          setVideoSrc(j.url)
          setAspectRatio(j.aspectRatio || episode.aspect_ratio || '9:16')
          setResumeAt(Number(j.resumeAt) || 0)
          setAssetId(j.assetId || null)
        }
      })
      .catch(() => {})
  }, [isUnlocked, shouldLoad, videoSrc, episode.id, episode.aspect_ratio])

  // Load subtitle list for this episode
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('subtitles')
      .select('lang, storage_path')
      .eq('episode_id', episode.id)
      .then(({ data }) => {
        const list = (data as any[]) || []
        setSubs(list)
        // default subtitle = user's saved UI language, if available
        const pref = getSavedLang()
        if (list.find((s) => s.lang === pref)) setActiveSub(pref)
      })
  }, [episode.id])

  // Apply the chosen subtitle track to the <video>
  useEffect(() => {
    const v = slideRef.current?.querySelector('video') as HTMLVideoElement | null
    if (!v || !v.textTracks) return
    for (let i = 0; i < v.textTracks.length; i++) {
      const tt = v.textTracks[i]
      tt.mode = tt.language === activeSub ? 'showing' : 'hidden'
    }
  }, [activeSub, videoSrc, subs])

  const handleTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-tap')) return
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // double tap = like
      setLiked(true)
      const heart = document.createElement('div')
      heart.className = 'heart-pop'
      heart.textContent = '♥'
      heart.style.left = e.clientX + 'px'
      heart.style.top = e.clientY + 'px'
      slideRef.current?.appendChild(heart)
      setTimeout(() => heart.remove(), 800)
    } else {
      // single tap = pause/play
      const v = slideRef.current?.querySelector('video') as HTMLVideoElement
      if (v) {
        if (v.paused) {
          v.play()
          setPaused(false)
        } else {
          v.pause()
          setPaused(true)
        }
      }
    }
    lastTapRef.current = now
  }

  const toggleFavorite = async () => {
    const next = !favorited
    setFavorited(next)
    await fetch('/api/favorite', {
      method: next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId: series.id })
    })
    toast(next ? 'Added to favorites' : 'Removed')
  }

  const share = async () => {
    const url = `${window.location.origin}/series/${series.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: series.title, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast('Link copied')
    }
  }

  return (
    <div
      ref={slideRef}
      data-slide
      data-idx={idx}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      onClick={handleTap}
    >
      {/* Poster fallback */}
      {episode.thumbnail_url && (
        <img
          src={episode.thumbnail_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Video */}
      {isUnlocked && videoSrc && (
        <SmartVideoPlayer
          videoRef={videoRef}
          src={videoSrc}
          isActive={isActive}
          className="absolute inset-0 w-full h-full object-cover"
          poster={episode.thumbnail_url || undefined}
          episodeId={episode.id}
          seriesId={series.id}
          assetId={assetId}
          aspectRatio={aspectRatio}
          resumeAt={resumeAt}
          onEnded={onEnded}
          tracks={subs.map((s) => ({
            key: s.lang,
            srcLang: s.lang,
            label: langLabel(s.lang),
            src: s.storage_path
          }))}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.9) 100%)'
        }}
      />

      {/* Pause indicator */}
      {paused && isUnlocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-black/45 backdrop-blur-xl flex items-center justify-center pointer-events-none">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      {/* Episode pill */}
      <div
        className="absolute left-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10"
        style={{ top: 'calc(env(safe-area-inset-top) + 64px)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-brand-pink dot-pulse" />
        Ep {episode.episode_number} {episode.is_free && '· Free'}
      </div>

      {/* Info bottom-left */}
      <div className="absolute left-4 right-20 z-10" style={{ bottom: '100px' }}>
        {series.category && (
          <span className="inline-block bg-brand-gradient text-white text-[10px] font-extrabold px-2 py-0.5 rounded mb-2.5 tracking-wider uppercase">
            {series.category}
          </span>
        )}
        <h2 className="text-xl font-extrabold mb-1 drop-shadow-lg">{series.title}</h2>
        <div className="text-[13px] opacity-85 mb-2 drop-shadow">
          Ep {episode.episode_number} / {series.total_episodes}
        </div>
        <p className="text-[13.5px] leading-snug opacity-95 drop-shadow line-clamp-2">
          {episode.description || series.description}
        </p>
      </div>

      {/* Action rail */}
      <div className="absolute right-3 z-10 flex flex-col gap-5 no-tap" style={{ bottom: '110px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setLiked(!liked)
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center border transition-all',
              liked ? 'bg-brand-pink/25 border-brand-pink' : 'bg-black/35 border-white/15'
            )}
          >
            <Heart size={22} className={liked ? 'text-brand-pink fill-brand-pink' : 'text-white'} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">
            {Number(series.like_count || 0).toLocaleString()}
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite()
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={clsx(
              'w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center border',
              favorited ? 'bg-brand-orange/25 border-brand-orange' : 'bg-black/35 border-white/15'
            )}
          >
            <Bookmark
              size={22}
              className={favorited ? 'text-brand-orange fill-brand-orange' : 'text-white'}
            />
          </div>
          <span className="text-[11px] font-bold drop-shadow">Save</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            share()
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/15">
            <Share2 size={20} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">Share</span>
        </button>

        <a
          href={`/series/${series.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/15">
            <List size={20} />
          </div>
          <span className="text-[11px] font-bold drop-shadow">Eps</span>
        </a>

        {subs.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSubMenu(true)
            }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={clsx(
                'w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center border',
                activeSub ? 'bg-brand-pink/25 border-brand-pink' : 'bg-black/35 border-white/15'
              )}
            >
              <Captions size={20} className={activeSub ? 'text-brand-pink' : 'text-white'} />
            </div>
            <span className="text-[11px] font-bold drop-shadow">CC</span>
          </button>
        )}
      </div>

      {/* Subtitle language menu */}
      {subMenu && (
        <div
          className="absolute inset-0 z-30 bg-black/70 backdrop-blur flex items-end no-tap"
          onClick={(e) => {
            e.stopPropagation()
            setSubMenu(false)
          }}
        >
          <div
            className="w-full bg-[#1c1c1e] rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-extrabold mb-3">Subtitles</div>
            <button
              onClick={() => {
                setActiveSub(null)
                setSubMenu(false)
              }}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl mb-1.5 text-sm',
                !activeSub ? 'bg-brand-pink/20 text-brand-pink font-bold' : 'bg-white/[0.06]'
              )}
            >
              Off
            </button>
            {subs.map((s) => (
              <button
                key={s.lang}
                onClick={() => {
                  setActiveSub(s.lang)
                  setSubMenu(false)
                }}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl mb-1.5 text-sm',
                  activeSub === s.lang
                    ? 'bg-brand-pink/20 text-brand-pink font-bold'
                    : 'bg-white/[0.06]'
                )}
              >
                {langLabel(s.lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paywall */}
      {showPaywall && (
        <Paywall
          series={series}
          episode={episode}
          currentCoins={currentCoins}
          isVip={isVip}
          onCoin={onUnlockCoin}
          onAd={onUnlockAd}
        />
      )}
    </div>
  )
}

function SmartVideoPlayer({
  src,
  isActive,
  videoRef,
  className,
  poster,
  tracks,
  episodeId,
  seriesId,
  assetId,
  aspectRatio,
  resumeAt,
  onEnded
}: {
  src: string
  isActive: boolean
  videoRef: (el: HTMLVideoElement | null) => void
  className?: string
  poster?: string
  tracks: { key: string; srcLang: string; label: string; src: string }[]
  episodeId: string
  seriesId: string
  assetId: string | null
  aspectRatio: AspectRatio
  resumeAt: number
  onEnded: () => void
}) {
  const source = getVideoSource(src)

  useEffect(() => {
    if (source.type !== 'file') videoRef(null)
  }, [source.type, videoRef])

  if (source.type === 'youtube' || source.type === 'dailymotion') {
    if (!isActive) return null
    return (
      <iframe
        src={source.embedUrl}
        className={className}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        title="Episode video"
      />
    )
  }

  return (
    <VideoPlayer
      videoRef={videoRef}
      src={source.url}
      isActive={isActive}
      className={className}
      poster={poster}
      episodeId={episodeId}
      seriesId={seriesId}
      assetId={assetId}
      aspectRatio={aspectRatio}
      resumeAt={resumeAt}
      onEnded={onEnded}
    >
      {tracks.map((track) => (
        <track
          key={track.key}
          kind="subtitles"
          srcLang={track.srcLang}
          label={track.label}
          src={track.src}
        />
      ))}
    </VideoPlayer>
  )
}

function VideoPlayer({
  src,
  isActive,
  videoRef,
  className,
  poster,
  children,
  episodeId,
  seriesId,
  assetId,
  aspectRatio,
  resumeAt,
  onEnded
}: {
  src: string
  isActive: boolean
  videoRef: (el: HTMLVideoElement | null) => void
  className?: string
  poster?: string
  children: React.ReactNode
  episodeId: string
  seriesId: string
  assetId: string | null
  aspectRatio: AspectRatio
  resumeAt: number
  onEnded: () => void
}) {
  const localRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const gestureRef = useRef<{ x: number; y: number; time: number; volume: number } | null>(null)
  const lastProgressRef = useRef(0)
  const [speed, setSpeed] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(1)
  const [manualFullscreen, setManualFullscreen] = useState(false)

  const saveProgress = useCallback(() => {
    const video = localRef.current
    if (!video || !Number.isFinite(video.currentTime)) return
    const payload = JSON.stringify({
      episodeId,
      seriesId,
      assetId,
      progressSeconds: video.currentTime
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/progress', new Blob([payload], { type: 'application/json' }))
    } else {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {})
    }
  }, [assetId, episodeId, seriesId])

  useEffect(() => {
    const video = localRef.current
    if (!video) return
    let disposed = false
    let cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }

    if (src.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      } else {
        import('hls.js')
          .then(({ default: Hls }) => {
            if (disposed) return
            if (!Hls.isSupported()) {
              video.src = src
              return
            }
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              maxBufferLength: 30,
              backBufferLength: 30
            })
            cleanup = () => hls.destroy()
            hls.loadSource(src)
            hls.attachMedia(video)
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (!data.fatal) return
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
            })
          })
          .catch(() => {
            if (!disposed) video.src = src
          })
      }
    } else {
      video.src = src
    }

    return () => {
      disposed = true
      cleanup()
    }
  }, [src])

  useEffect(() => {
    const video = localRef.current
    if (!video) return
    if (isActive) video.play().catch(() => {})
    else video.pause()
  }, [isActive, src])

  useEffect(() => {
    const video = localRef.current
    if (!video || resumeAt <= 0) return
    const resume = () => {
      if (resumeAt < Math.max(0, video.duration - 5)) video.currentTime = resumeAt
    }
    video.addEventListener('loadedmetadata', resume, { once: true })
    return () => video.removeEventListener('loadedmetadata', resume)
  }, [resumeAt, src])

  useEffect(() => {
    const continuePlayback = () => {
      if (isActive) localRef.current?.play().catch(() => {})
    }
    window.addEventListener('online', continuePlayback)
    window.addEventListener('pagehide', saveProgress)
    return () => {
      window.removeEventListener('online', continuePlayback)
      window.removeEventListener('pagehide', saveProgress)
    }
  }, [isActive, saveProgress])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) return
      const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void }
      orientation.unlock?.()
      setRotation(0)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75]
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length]
    setSpeed(next)
    if (localRef.current) localRef.current.playbackRate = next
  }

  const togglePictureInPicture = async () => {
    const video = localRef.current
    if (!video || !document.pictureInPictureEnabled) return
    if (document.pictureInPictureElement) await document.exitPictureInPicture()
    else await video.requestPictureInPicture()
  }

  const lockLandscape = async () => {
    if (aspectRatio !== '16:9') return
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape') => Promise<void>
    }
    await orientation.lock?.('landscape').catch(() => {})
  }

  const toggleFullscreen = async () => {
    const player = playerRef.current
    const video = localRef.current as
      (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (!player || !video) return
    if (manualFullscreen) {
      setManualFullscreen(false)
      setRotation(0)
      return
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      setManualFullscreen(false)
      return
    }
    try {
      await player.requestFullscreen()
      await lockLandscape()
    } catch {
      if (video.webkitEnterFullscreen) video.webkitEnterFullscreen()
      else {
        setManualFullscreen(true)
        if (aspectRatio === '16:9') setRotation(90)
      }
    }
  }

  const rotateVideo = () => {
    setRotation((current) => (current === 0 ? 90 : current === 90 ? 270 : 0))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const video = localRef.current
    if (!video || (event.target as HTMLElement).closest('.no-tap')) return
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: video.currentTime,
      volume: video.volume
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = gestureRef.current
    const video = localRef.current
    const player = playerRef.current
    if (!start || !video || !player) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      video.currentTime = Math.max(0, Math.min(video.duration || Infinity, start.time + dx / 5))
    } else if (Math.abs(dy) > 12) {
      const delta = -dy / player.clientHeight
      if (start.x < player.clientWidth / 2) setBrightness(Math.min(1.5, Math.max(0.35, 1 + delta)))
      else video.volume = Math.min(1, Math.max(0, start.volume + delta))
    }
  }

  const handleTimeUpdate = () => {
    const video = localRef.current
    if (!video || video.currentTime - lastProgressRef.current < 10) return
    lastProgressRef.current = video.currentTime
    saveProgress()
  }

  const finishEpisode = () => {
    saveProgress()
    onEnded()
  }

  return (
    <div
      ref={playerRef}
      className={clsx(className, manualFullscreen && '!fixed !inset-0 !z-[100] bg-black')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        gestureRef.current = null
      }}
      style={{ touchAction: 'none' }}
    >
      <video
        ref={(element) => {
          localRef.current = element
          videoRef(element)
        }}
        className={clsx(
          'h-full w-full transition-transform duration-300',
          aspectRatio === '16:9' ? 'object-contain' : 'object-cover'
        )}
        style={{
          filter: `brightness(${brightness})`,
          transform: `rotate(${rotation}deg) ${rotation ? 'scale(0.5625)' : ''}`
        }}
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        crossOrigin="anonymous"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={finishEpisode}
      >
        {children}
      </video>
      {isActive && (
        <div className="no-tap absolute right-3 top-[max(env(safe-area-inset-top),16px)] z-20 flex gap-2">
          <PlayerButton label={`${speed}×`} onClick={cycleSpeed}>
            <Gauge size={16} />
          </PlayerButton>
          <PlayerButton label="PiP" onClick={togglePictureInPicture}>
            <PictureInPicture size={16} />
          </PlayerButton>
          <PlayerButton label="Rotate" onClick={rotateVideo}>
            <RotateCw size={16} />
          </PlayerButton>
          <PlayerButton label="Full" onClick={toggleFullscreen}>
            <Maximize size={16} />
          </PlayerButton>
        </div>
      )}
    </div>
  )
}

function PlayerButton({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void | Promise<void>
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        void onClick()
      }}
      aria-label={label}
      className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 text-[10px] font-bold backdrop-blur"
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function Paywall({
  series,
  episode,
  currentCoins,
  isVip,
  onCoin,
  onAd
}: {
  series: Series
  episode: Episode
  currentCoins: number
  isVip: boolean
  onCoin: () => void
  onAd: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-20 bg-black/85 backdrop-blur flex flex-col items-center justify-center px-8 no-tap"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 shadow-2xl shadow-brand-pink/40">
        <Lock size={26} />
      </div>
      <h3 className="text-2xl font-extrabold mb-2 text-center">Unlock to keep watching</h3>
      <p className="text-sm opacity-70 mb-7 text-center leading-relaxed">
        Episode {episode.episode_number} · Choose any method below
      </p>

      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={onCoin}
          className="bg-gradient-to-br from-brand-pink/15 to-brand-orange/15 border border-brand-pink/40 px-4 py-3.5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-brand-gold font-black">¤</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Use Coins</div>
              <div className="text-[11px] opacity-60">Balance: {currentCoins}</div>
            </div>
          </div>
          <div className="text-sm font-bold text-brand-orange">{series.coin_price} coins</div>
        </button>

        <a
          href="/wallet"
          className="bg-white/[0.06] border border-white/10 px-4 py-3.5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-brand-orange">★</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Subscribe to VIP</div>
              <div className="text-[11px] opacity-60">Unlimited episodes · No ads</div>
            </div>
          </div>
          <div className="text-sm font-bold text-brand-gold">From $4.99</div>
        </a>

        <button
          onClick={onAd}
          className="bg-white/[0.06] border border-white/10 px-4 py-3.5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span>▶</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Watch an ad</div>
              <div className="text-[11px] opacity-60">Unlock this episode for free</div>
            </div>
          </div>
          <div className="text-sm font-bold text-brand-gold">Free</div>
        </button>
      </div>
    </div>
  )
}
