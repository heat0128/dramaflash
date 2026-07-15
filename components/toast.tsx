'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type ToastContextValue = { show: (msg: string) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const show = useCallback((m: string) => {
    setMsg(m)
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="fixed left-1/2 z-[100] pointer-events-none transition-all duration-200"
        style={{
          top: 'calc(env(safe-area-inset-top) + 80px)',
          transform: `translateX(-50%) translateY(${visible ? '0' : '-10px'})`,
          opacity: visible ? 1 : 0
        }}
      >
        <div className="bg-black/90 backdrop-blur-xl px-5 py-2.5 rounded-full text-sm font-semibold border border-white/10 whitespace-nowrap">
          {msg}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
