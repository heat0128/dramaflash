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
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
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
}

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
