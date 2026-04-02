import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMultipleTabValues, getSheetValues } from '@/lib/google-sheets'
import { extractHeaders } from '@/lib/column-detector'

export async function POST(
  req: Request,
  { params }: { params: { sheetId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { tabs }: { tabs: string[] } = body

  if (!tabs || tabs.length === 0) {
    return NextResponse.json({ error: 'No tabs specified' }, { status: 400 })
  }

  try {
    const results = await getMultipleTabValues(params.sheetId, tabs, session.accessToken)

    // Return raw rows per tab plus detected headers
    const payload: Record<string, { headers: string[]; rows: string[][] }> = {}
    for (const [tab, sheetValues] of Object.entries(results)) {
      const allRows = sheetValues.values ?? []
      const headers = extractHeaders(allRows)
      // Data rows start after first non-empty row
      const headerRowIdx = allRows.findIndex(
        (r) => r.filter((c) => c?.trim()).length >= 2
      )
      const rows = headerRowIdx >= 0 ? allRows.slice(headerRowIdx + 1) : allRows
      payload[tab] = { headers, rows }
    }

    return NextResponse.json({ data: payload })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Also support GET for a single tab's headers (for column mapping preview)
export async function GET(
  req: Request,
  { params }: { params: { sheetId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const tab = url.searchParams.get('tab')
  if (!tab) return NextResponse.json({ error: 'No tab specified' }, { status: 400 })

  try {
    const sv = await getSheetValues(params.sheetId, tab, session.accessToken, 'A1:Z5')
    const headers = extractHeaders(sv.values ?? [])
    return NextResponse.json({ headers })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
