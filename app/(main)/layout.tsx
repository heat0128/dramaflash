import { ToastProvider } from '@/components/toast'
import { TabBar } from '@/components/tab-bar'
import { InstallPrompt } from '@/components/install-prompt'
import { LanguageProvider } from '@/lib/i18n'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        {children}
        <TabBar />
        <InstallPrompt />
      </ToastProvider>
    </LanguageProvider>
  )
}
