'use client'

import { useEffect, useRef, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<unknown>
}

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed? Don't show.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) return

    // Already dismissed recently?
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - Number(dismissed) < 7 * 86400_000) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      const t = setTimeout(() => setShow(true), 8000)
      return () => clearTimeout(t)
    }

    // Android / desktop Chrome
    const handler = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()
      deferredRef.current = installEvent
      setTimeout(() => setShow(true), 8000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-dismissed', String(Date.now()))
  }

  const install = async () => {
    const deferred = deferredRef.current
    if (deferred) {
      deferred.prompt()
      await deferred.userChoice
    }
    dismiss()
  }

  if (!show) return null

  if (isIOS) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur flex items-end justify-center"
        onClick={dismiss}
      >
        <div
          className="bg-[#1c1c1e]/98 backdrop-blur-2xl w-full max-w-[480px] rounded-t-3xl p-7 pb-10"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}
        >
          <div className="flex items-center gap-3.5 mb-5">
            <img src="/favicon.png" alt="BingeGo" className="w-14 h-14 rounded-2xl" />
            <div>
              <div className="text-lg font-extrabold">Install BingeGo</div>
              <div className="text-xs opacity-60">Add to Home Screen in 3 steps</div>
            </div>
          </div>
          <div className="bg-white/[0.06] rounded-2xl p-2">
            <Step
              n={1}
              text={
                <>
                  Tap the <b>Share</b> button below in Safari
                </>
              }
            />
            <Step
              n={2}
              text={
                <>
                  Scroll and tap <b>Add to Home Screen</b>
                </>
              }
            />
            <Step
              n={3}
              text={
                <>
                  Tap <b>Add</b> in the top-right
                </>
              }
              last
            />
          </div>
          <button
            onClick={dismiss}
            className="w-full mt-5 bg-brand-gradient py-3.5 rounded-xl font-bold"
          >
            Got It
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] bg-[#141414]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 z-[50] shadow-2xl">
      <img src="/favicon.png" alt="BingeGo" className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">Install BingeGo</div>
        <div className="text-[11px] opacity-60 leading-tight">Full-screen, app-like experience</div>
      </div>
      <button onClick={dismiss} className="opacity-50 px-2 text-lg">
        ×
      </button>
      <button
        onClick={install}
        className="bg-brand-gradient px-4 py-2 rounded-full text-xs font-bold flex-shrink-0"
      >
        Install
      </button>
    </div>
  )
}

function Step({ n, text, last }: { n: number; text: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3.5 p-3 ${!last ? 'border-b border-white/[0.06]' : ''}`}>
      <div className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-extrabold text-xs flex-shrink-0">
        {n}
      </div>
      <div className="text-[13.5px] leading-snug [&_b]:text-brand-orange [&_b]:font-bold">
        {text}
      </div>
    </div>
  )
}
