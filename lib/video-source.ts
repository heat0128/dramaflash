export type VideoSource =
  | { type: 'youtube'; embedUrl: string }
  | { type: 'dailymotion'; embedUrl: string }
  | { type: 'file'; url: string; isHls: boolean }

function firstMatch(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function getVideoSource(rawUrl: string): VideoSource {
  const url = rawUrl.trim()

  const youtubeId = firstMatch(url, [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/
  ])
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&rel=0&modestbranding=1&autoplay=1`
    }
  }

  const dailymotionId = firstMatch(url, [
    /dailymotion\.com\/video\/([A-Za-z0-9]+)/,
    /dai\.ly\/([A-Za-z0-9]+)/
  ])
  if (dailymotionId) {
    return {
      type: 'dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionId}?autoplay=1&queue-enable=false`
    }
  }

  return {
    type: 'file',
    url,
    isHls: url.toLowerCase().includes('.m3u8')
  }
}
