/**
 * Auto-detect which column headers map to which semantic fields.
 * Uses keyword matching with priority scoring.
 */

type FieldKey = 'date' | 'description' | 'category' | 'amount' | 'currency' | 'paymentMethod' | 'type'

interface FieldMatcher {
  keywords: string[]
  antiKeywords?: string[]
}

const MATCHERS: Record<FieldKey, FieldMatcher> = {
  date: {
    keywords: ['date', 'datum', 'תאריך', 'дата', 'data', 'dt', 'day', 'time', 'timestamp'],
    antiKeywords: ['update', 'created', 'modified'],
  },
  description: {
    keywords: [
      'description', 'desc', 'detail', 'details', 'note', 'notes', 'memo',
      'narration', 'particulars', 'text', 'label', 'name', 'item', 'merchant',
      'תיאור', 'פרטים', 'הערה', 'описание', 'примечание', 'назва', 'опис',
    ],
  },
  category: {
    keywords: [
      'category', 'cat', 'categ', 'type', 'group', 'segment', 'tag', 'tags',
      'קטגוריה', 'סוג', 'категория', 'тип', 'категорія',
    ],
  },
  amount: {
    keywords: [
      'amount', 'sum', 'total', 'value', 'price', 'cost', 'debit', 'credit',
      'charge', 'payment', 'spend', 'expense',
      'סכום', 'עלות', 'מחיר', 'сумма', 'сумa', 'вартість',
    ],
    antiKeywords: ['currency', 'account'],
  },
  currency: {
    keywords: ['currency', 'curr', 'ccy', 'coin', 'עמלה', 'מטבע', 'валюта'],
  },
  paymentMethod: {
    keywords: [
      'payment method', 'method', 'instrument', 'card', 'account', 'wallet',
      'channel', 'mode', 'אמצעי תשלום', 'способ оплаты',
    ],
  },
  type: {
    keywords: [
      'type', 'kind', 'direction', 'in/out', 'income/expense', 'credit/debit',
      'סוג', 'кредит/дебет',
    ],
  },
}

function score(header: string, matcher: FieldMatcher): number {
  const lower = header.toLowerCase().trim()
  let s = 0
  for (const kw of matcher.keywords) {
    if (lower === kw) { s += 100; break }
    if (lower.includes(kw)) { s += 50; break }
    if (kw.includes(lower) && lower.length > 2) { s += 20; break }
  }
  if (s > 0 && matcher.antiKeywords) {
    for (const anti of matcher.antiKeywords) {
      if (lower.includes(anti)) { s = 0; break }
    }
  }
  return s
}

export function autoDetectColumns(headers: string[]): Partial<Record<FieldKey, string>> {
  const detected: Partial<Record<FieldKey, string>> = {}
  const used = new Set<string>()

  // Process fields in priority order
  const fields: FieldKey[] = ['date', 'amount', 'description', 'category', 'currency', 'paymentMethod', 'type']

  for (const field of fields) {
    let best = { header: '', score: 0 }
    for (const header of headers) {
      if (used.has(header)) continue
      const s = score(header, MATCHERS[field])
      if (s > best.score) best = { header, score: s }
    }
    if (best.score > 0) {
      detected[field] = best.header
      used.add(best.header)
    }
  }

  return detected
}

export function extractHeaders(rows: string[][]): string[] {
  if (!rows || rows.length === 0) return []
  // Find first non-empty row – that's the header row
  for (const row of rows.slice(0, 5)) {
    const non = row.filter((c) => c && c.trim())
    if (non.length >= 2) return row.map((c) => c?.trim() ?? '')
  }
  return []
}
