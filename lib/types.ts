export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  coins: number
  is_vip: boolean
  vip_expires_at: string | null
  is_admin: boolean
  created_at: string
}

export type Series = {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  vertical_cover_url: string | null
  category: string | null
  tags: string[]
  total_episodes: number
  free_episodes: number
  coin_price: number
  is_published: boolean
  is_featured?: boolean
  featured_order?: number
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  slug?: string | null
  original_language?: string
  status?: ContentStatus
  published_at?: string | null
  age_rating?: string | null
  season_price?: number | null
}

export type Episode = {
  id: string
  series_id: string
  episode_number: number
  title: string | null
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  is_free: boolean
  view_count: number
  created_at: string
  slug?: string | null
  status?: ContentStatus
  aspect_ratio?: AspectRatio
  published_at?: string | null
  updated_at?: string
}

export type ContentStatus = 'DRAFT' | 'PROCESSING' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED'

export type AspectRatio = '9:16' | '16:9' | '1:1' | 'OTHER'

export type VideoAssetType = 'FULL_VIDEO' | 'AUDIO_ONLY' | 'SUBTITLE_ONLY'

export type VideoAssetStatus =
  'PENDING_UPLOAD' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR' | 'ARCHIVED'

export type VideoAsset = {
  id: string
  episode_id: string
  source_asset_id: string | null
  provider: string
  provider_asset_id: string | null
  playback_id: string | null
  language: string
  type: VideoAssetType
  status: VideoAssetStatus
  aspect_ratio: AspectRatio
  width: number | null
  height: number | null
  duration_seconds: number | null
  thumbnail_url: string | null
  preview_url: string | null
  signed_playback_required: boolean
  processing_error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  slug: string
  name_key: string
  display_order: number
  is_active: boolean
}

export type ContentPlacement =
  'CONTINUE_WATCHING' | 'TRENDING' | 'NEW' | 'POPULAR' | 'RECOMMENDED' | 'LATEST'

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type CoinPack = {
  id: string
  coins: number
  bonus_coins: number
  price_usd: number
  stripe_price_id: string | null
  display_order: number
  is_active: boolean
  label: string | null
}

export type SubscriptionPlan = {
  id: string
  name: string
  duration_days: number
  coins_included: number
  price_usd: number
  stripe_price_id: string | null
  display_order: number
  is_active: boolean
  is_featured: boolean
}

export type Unlock = {
  id: string
  user_id: string
  episode_id: string
  method: 'coin' | 'vip' | 'ad' | 'free'
  coins_spent: number
  created_at: string
}
