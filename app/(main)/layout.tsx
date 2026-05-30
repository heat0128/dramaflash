import { ToastProvider } from '@/components/toast'
import { TabBar } from '@/components/tab-bar'
import { InstallPrompt } from '@/components/install-prompt'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <TabBar />
      <InstallPrompt />
    </ToastProvider>
  )
}
