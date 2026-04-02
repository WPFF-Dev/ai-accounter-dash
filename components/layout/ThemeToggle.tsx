'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-ghost p-2">
        <Icon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 card shadow-card-hover min-w-[140px] py-1 z-50 animate-in">
          {[
            { value: 'light', icon: Sun, label: t('theme.light') },
            { value: 'dark', icon: Moon, label: t('theme.dark') },
            { value: 'system', icon: Monitor, label: t('theme.system') },
          ].map(({ value, icon: ItemIcon, label }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors
                ${theme === value ? 'text-brand-500' : 'text-[hsl(var(--foreground))]'}`}
            >
              <ItemIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
