export const DEFAULT_EPISODE_PRICE_USD = 1.99
export const DEFAULT_SEASON_PRICE_USD = 19.99
export const SUPPORTED_CURRENCIES = new Set([
  'USD',
  'JPY',
  'KRW',
  'THB',
  'VND',
  'IDR',
  'EUR',
  'GBP'
])

export type CheckoutType = 'coin_pack' | 'subscription' | 'episode' | 'season'

export function toMinorUnits(amount: number, currency: string) {
  const zeroDecimal = new Set(['JPY', 'KRW', 'VND'])
  return Math.round(amount * (zeroDecimal.has(currency) ? 1 : 100))
}
