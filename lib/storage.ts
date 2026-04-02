/**
 * Thin storage layer: localStorage for MVP.
 * Swap for Supabase by implementing the same interface with fetch calls.
 */
import type { SheetConfig } from '@/types'

const CONFIGS_KEY = 'ai_accounter_configs'
const PREFS_KEY = 'ai_accounter_prefs'

// ─── Sheet config (column mapping) ────────────────────────────────────────

export function saveSheetConfig(config: SheetConfig): void {
  if (typeof window === 'undefined') return
  const all = loadAllConfigs()
  all[config.sheetId] = { ...config, savedAt: new Date().toISOString() }
  try {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(all))
  } catch (e) {
    console.warn('Storage write failed', e)
  }
}

export function loadSheetConfig(sheetId: string): SheetConfig | null {
  if (typeof window === 'undefined') return null
  const all = loadAllConfigs()
  return all[sheetId] ?? null
}

export function loadAllConfigs(): Record<string, SheetConfig> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CONFIGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function deleteSheetConfig(sheetId: string): void {
  if (typeof window === 'undefined') return
  const all = loadAllConfigs()
  delete all[sheetId]
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(all))
}

// ─── User preferences ─────────────────────────────────────────────────────

export interface UserPrefs {
  locale: string
  theme: 'light' | 'dark' | 'system'
  openaiKey?: string
  defaultCurrency: string
}

const DEFAULT_PREFS: UserPrefs = {
  locale: 'en',
  theme: 'dark',
  defaultCurrency: 'USD',
}

export function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: Partial<UserPrefs>): void {
  if (typeof window === 'undefined') return
  const current = loadPrefs()
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }))
}
