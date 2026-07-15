import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SwRegister } from '@/components/sw-register'
import { getRequestMarket } from '@/lib/i18n-server'
import { PUBLIC_LANGUAGES, type LangCode } from '@/lib/languages'

const seoCopy: Record<LangCode, { title: string; description: string }> = {
  en: {
    title: 'BingeGo · Short Dramas, Endless Stories',
    description: 'Stream addictive short dramas anywhere, anytime.'
  },
  ja: {
    title: 'BingeGo · 短編ドラマをいつでも',
    description: '話題の短編ドラマをいつでもどこでも楽しめます。'
  },
  ko: {
    title: 'BingeGo · 끝없이 즐기는 숏드라마',
    description: '화제의 숏드라마를 언제 어디서나 감상하세요.'
  },
  th: {
    title: 'BingeGo · ซีรีส์สั้น ดูได้ไม่รู้จบ',
    description: 'รับชมซีรีส์สั้นยอดนิยมได้ทุกที่ทุกเวลา'
  },
  vi: {
    title: 'BingeGo · Phim ngắn, câu chuyện bất tận',
    description: 'Xem những bộ phim ngắn hấp dẫn mọi lúc mọi nơi.'
  },
  id: {
    title: 'BingeGo · Drama Pendek Tanpa Henti',
    description: 'Tonton drama pendek terpopuler kapan saja dan di mana saja.'
  }
}

export function generateMetadata(): Metadata {
  const { locale } = getRequestMarket()
  const copy = seoCopy[locale]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bingego.com'

  return {
    metadataBase: new URL(siteUrl),
    title: copy.title,
    description: copy.description,
    manifest: '/manifest.json',
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        PUBLIC_LANGUAGES.map((language) => [language.code, `/${language.code}`])
      )
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: 'website',
      locale,
      siteName: 'BingeGo',
      images: ['/logo.png']
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: ['/logo.png']
    },
    icons: {
      icon: '/favicon.png',
      apple: '/apple-touch-icon.png'
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'BingeGo'
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = getRequestMarket()
  return (
    <html lang={locale}>
      <body>
        <div className="app-shell">{children}</div>
        <SwRegister />
      </body>
    </html>
  )
}
