import { type NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LANGUAGE, isPublicLanguage, type LangCode } from '@/lib/languages'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_FILE = /\.[^/]+$/
const UNLOCALIZED_PREFIXES = ['/api', '/admin', '/auth', '/_next']
const COUNTRY_CURRENCY: Record<string, string> = {
  JP: 'JPY',
  KR: 'KRW',
  TH: 'THB',
  VN: 'VND',
  ID: 'IDR',
  CN: 'CNY',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR'
}

function preferredLocale(request: NextRequest): LangCode {
  const cookieLocale = request.cookies.get('app_locale')?.value
  if (cookieLocale && isPublicLanguage(cookieLocale)) return cookieLocale

  const accepted = request.headers.get('accept-language') || ''
  for (const part of accepted.split(',')) {
    const code = part.trim().split(';')[0].split('-')[0]
    if (isPublicLanguage(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isUnlocalized =
    PUBLIC_FILE.test(pathname) || UNLOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isUnlocalized) return updateSession(request)

  const segments = pathname.split('/').filter(Boolean)
  const pathLocale = segments[0]
  if (!pathLocale || !isPublicLanguage(pathLocale)) {
    const locale = preferredLocale(request)
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(redirectUrl)
  }

  const country =
    request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'US'
  const currency = COUNTRY_CURRENCY[country] || 'USD'
  const timeZone = request.cookies.get('app_timezone')?.value || 'UTC'
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-app-locale', pathLocale)
  requestHeaders.set('x-app-country', country)
  requestHeaders.set('x-app-currency', currency)
  requestHeaders.set('x-app-timezone', timeZone)

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = `/${segments.slice(1).join('/')}` || '/'
  const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
  response.cookies.set('app_locale', pathLocale, {
    path: '/',
    maxAge: 31_536_000,
    sameSite: 'lax'
  })
  return updateSession(request, response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
