import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SwRegister } from '@/components/sw-register'

export const metadata: Metadata = {
  title: 'BingeGo · Short Dramas, Endless Stories',
  description: 'Stream the hottest short dramas. Watch anywhere, anytime.',
  manifest: '/manifest.json',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
        <SwRegister />
      </body>
    </html>
  )
}
