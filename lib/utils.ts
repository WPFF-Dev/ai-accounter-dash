import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid, parse } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency ─────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 2 })}`
  }
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

// ─── Date parsing ─────────────────────────────────────────────────────────

const DATE_FORMATS = [
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'yyyy-MM-dd',
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  'd/M/yyyy',
  'M/d/yyyy',
  'dd.MM.yyyy',
  'MM.dd.yyyy',
  'dd MMM yyyy',
  'MMM dd yyyy',
  'MMM d, yyyy',
  'd MMM yyyy',
  'yyyy/MM/dd',
]

export function parseDate(str: string): Date | null {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  if (!trimmed) return null

  // ISO format
  try {
    const d = parseISO(trimmed)
    if (isValid(d)) return d
  } catch {}

  // Try numeric serial (Google Sheets date)
  const serial = Number(trimmed)
  if (!isNaN(serial) && serial > 1000 && serial < 100000) {
    const epoch = new Date(1899, 11, 30)
    const d = new Date(epoch.getTime() + serial * 86400000)
    if (isValid(d)) return d
  }

  // Try known formats
  for (const fmt of DATE_FORMATS) {
    try {
      const d = parse(trimmed, fmt, new Date())
      if (isValid(d) && d.getFullYear() > 1990) return d
    } catch {}
  }

  // Native Date
  const d = new Date(trimmed)
  if (isValid(d) && d.getFullYear() > 1990) return d

  return null
}

export function formatDate(date: Date, fmt = 'MMM d, yyyy'): string {
  return format(date, fmt)
}

// ─── Amount parsing ────────────────────────────────────────────────────────

export function parseAmount(str: string | number): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str

  const cleaned = String(str)
    .replace(/[^\d.,\-+]/g, '')  // keep digits, dot, comma, sign
    .replace(/,(\d{3})/g, '$1')  // remove thousand-separator commas
    .replace(/,/g, '.')          // convert remaining commas to dots

  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// ─── Color palette for categories ─────────────────────────────────────────

const PALETTE = [
  '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#F97316', '#EC4899', '#6366F1', '#14B8A6',
  '#84CC16', '#A855F7', '#0EA5E9', '#22D3EE', '#FB923C',
]

export function getCategoryColor(index: number): string {
  return PALETTE[index % PALETTE.length]
}

// ─── Misc ─────────────────────────────────────────────────────────────────

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str: string, n = 40): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sumBy<T>(arr: T[], key: (item: T) => number): number {
  return arr.reduce((sum, item) => sum + key(item), 0)
}
