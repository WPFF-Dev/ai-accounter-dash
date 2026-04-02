import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSheetTabs, detectSheetStructure } from '@/lib/google-sheets'

export async function GET(
  _req: Request,
  { params }: { params: { sheetId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tabs = await getSheetTabs(params.sheetId, session.accessToken)
    const structureType = detectSheetStructure(tabs)
    return NextResponse.json({ tabs, structureType })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tabs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
