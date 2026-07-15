import { ToastProvider } from '@/components/toast'
import { TabBar } from '@/components/tab-bar'
import { InstallPrompt } from '@/components/install-prompt'
import { LanguageProvider } from '@/lib/i18n'
import { getRequestMarket } from '@/lib/i18n-server'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { locale } = getRequestMarket()
  return (
    <LanguageProvider initialLanguage={locale}>
      <ToastProvider>
        {children}
        <TabBar />
        <InstallPrompt />
      </ToastProvider>
    </LanguageProvider>
  )
}
