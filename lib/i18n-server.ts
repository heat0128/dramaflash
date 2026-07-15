import { headers } from 'next/headers'
import { DEFAULT_LANGUAGE, isPublicLanguage, type LangCode } from '@/lib/languages'

export type RequestMarket = {
  locale: LangCode
  country: string
  currency: string
  timeZone: string
}

export async function getRequestMarket(): Promise<RequestMarket> {
  const requestHeaders = await headers()
  const requestedLocale = requestHeaders.get('x-app-locale') || DEFAULT_LANGUAGE

  return {
    locale: isPublicLanguage(requestedLocale) ? requestedLocale : DEFAULT_LANGUAGE,
    country: requestHeaders.get('x-app-country') || 'US',
    currency: requestHeaders.get('x-app-currency') || 'USD',
    timeZone: requestHeaders.get('x-app-timezone') || 'UTC'
  }
}

export function formatCurrency(amount: number, market: RequestMarket) {
  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: market.currency
  }).format(amount)
}

export function formatDate(value: string | Date, market: RequestMarket) {
  return new Intl.DateTimeFormat(market.locale, {
    dateStyle: 'medium',
    timeZone: market.timeZone
  }).format(new Date(value))
}
