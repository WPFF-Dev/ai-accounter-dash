import type { GoogleSheet, SheetTab } from '@/types'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

async function gFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Google API error ${res.status}`)
  }
  return res.json() as T
}

// ─── List spreadsheets from Drive ──────────────────────────────────────────

export async function listGoogleSheets(accessToken: string): Promise<GoogleSheet[]> {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")
  const fields = encodeURIComponent('files(id,name,modifiedTime,thumbnailLink)')
  const url = `${DRIVE_API}/files?q=${q}&fields=${fields}&orderBy=modifiedTime+desc&pageSize=100`

  const data = await gFetch<{ files: GoogleSheet[] }>(url, accessToken)
  return data.files ?? []
}

// ─── Get spreadsheet metadata (tabs) ───────────────────────────────────────

export async function getSheetTabs(sheetId: string, accessToken: string): Promise<SheetTab[]> {
  const fields = encodeURIComponent('sheets.properties')
  const url = `${SHEETS_API}/${sheetId}?fields=${fields}`
  const data = await gFetch<{ sheets: Array<{ properties: SheetTab }> }>(url, accessToken)
  return (data.sheets ?? []).map((s) => s.properties)
}

// ─── Read sheet values ──────────────────────────────────────────────────────

export interface SheetValues {
  range: string
  majorDimension: string
  values: string[][]
}

export async function getSheetValues(
  sheetId: string,
  tabName: string,
  accessToken: string,
  range = 'A:Z'
): Promise<SheetValues> {
  const encoded = encodeURIComponent(`${tabName}!${range}`)
  const url = `${SHEETS_API}/${sheetId}/values/${encoded}`
  return gFetch<SheetValues>(url, accessToken)
}

export async function getMultipleTabValues(
  sheetId: string,
  tabNames: string[],
  accessToken: string
): Promise<Record<string, SheetValues>> {
  const results: Record<string, SheetValues> = {}
  await Promise.all(
    tabNames.map(async (tab) => {
      try {
        results[tab] = await getSheetValues(sheetId, tab, accessToken)
      } catch (e) {
        console.warn(`Failed to fetch tab "${tab}":`, e)
      }
    })
  )
  return results
}

// ─── Detect structure type from tab names ─────────────────────────────────

const YEAR_RE = /^(19|20)\d{2}$/
const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
  'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4, 'מאי': 5, 'יוני': 6,
  'יולי': 7, 'אוגוסט': 8, 'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12,
  'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4, 'май': 5, 'июнь': 6,
  'июль': 7, 'август': 8, 'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12,
}

export function detectSheetStructure(tabs: SheetTab[]): 'yearly' | 'monthly' | 'flat' {
  const names = tabs.map((t) => t.title.trim())

  const yearCount = names.filter((n) => YEAR_RE.test(n)).length
  if (yearCount >= 2 || (yearCount === 1 && names.length <= 3)) return 'yearly'

  const monthCount = names.filter((n) => {
    const lower = n.toLowerCase()
    return (
      MONTH_NAMES[lower] !== undefined ||
      /^(0?[1-9]|1[0-2])[-/.]?\d{0,4}$/.test(n) ||
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(n)
    )
  }).length

  if (monthCount >= 3) return 'monthly'
  return 'flat'
}
