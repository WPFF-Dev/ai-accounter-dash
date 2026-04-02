'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Locale, Direction } from '@/types'
import en from '@/locales/en.json'
import he from '@/locales/he.json'
import ru from '@/locales/ru.json'
import uk from '@/locales/uk.json'

const TRANSLATIONS: Record<Locale, Record<string, string>> = { en, he, ru, uk }

export const LOCALE_CONFIG: Record<Locale, { label: string; dir: Direction; flag: string }> = {
  en: { label: 'English', dir: 'ltr', flag: '🇺🇸' },
  he: { label: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  ru: { label: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  uk: { label: 'Українська', dir: 'ltr', flag: '🇺🇦' },
}

interface I18nContextType {
  locale: Locale
  dir: Direction
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  dir: 'ltr',
  setLocale: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    const browser = navigator.language.slice(0, 2) as Locale
    const initial = saved ?? (TRANSLATIONS[browser] ? browser : 'en')
    setLocaleState(initial)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    const dir = LOCALE_CONFIG[l].dir
    document.documentElement.lang = l
    document.documentElement.dir = dir
  }, [])

  useEffect(() => {
    const dir = LOCALE_CONFIG[locale].dir
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.en
      let str = dict[key] ?? TRANSLATIONS.en[key] ?? key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
        })
      }
      return str
    },
    [locale]
  )

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, dir: LOCALE_CONFIG[locale].dir, setLocale, t } },
    children
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
