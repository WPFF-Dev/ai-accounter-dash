import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { apiKey, summary } = await req.json()
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key required' }, { status: 400 })
  }

  const prompt = `You are a personal finance advisor. Analyze the following financial summary and provide:
1. Key insights about spending patterns (3-4 points)
2. Actionable recommendations to improve finances (3-4 points)
3. One notable observation or warning if applicable

Be concise, practical, and encouraging. Format as markdown with clear sections.

Financial Summary:
${JSON.stringify(summary, null, 2)}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json(
        { error: err?.error?.message ?? 'OpenAI API error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ insights: content })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
