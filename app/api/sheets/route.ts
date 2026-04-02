import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listGoogleSheets } from '@/lib/google-sheets'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sheets = await listGoogleSheets(session.accessToken)
    return NextResponse.json({ sheets })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sheets'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
