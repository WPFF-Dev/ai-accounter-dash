'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALE_CONFIG } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import type { Locale } from '@/types'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-ghost gap-1.5 px-2.5">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 card shadow-card-hover min-w-[160px] py-1 z-50 animate-in">
          {(Object.entries(LOCALE_CONFIG) as [Locale, typeof LOCALE_CONFIG[Locale]][]).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => { setLocale(code); setOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors
                ${locale === code ? 'text-brand-500 font-medium' : 'text-[hsl(var(--foreground))]'}`}
            >
              <span className="text-base">{cfg.flag}</span>
              <span>{cfg.label}</span>
              {cfg.dir === 'rtl' && (
                <span className="ml-auto text-[10px] text-[hsl(var(--muted-fg))] font-mono">RTL</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
