'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Key, Shield, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { loadPrefs, savePrefs } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
}

export default function AIInsights({ analytics }: Props) {
  const { t } = useI18n()
  const [apiKey, setApiKey] = useState(() => loadPrefs().openaiKey ?? '')
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!apiKey || !analytics) return
    setLoading(true)
    setError('')

    // Save key for session
    savePrefs({ openaiKey: apiKey })

    // Build condensed summary for the API
    const summary = {
      period: `${analytics.dateRange.from.toDateString()} to ${analytics.dateRange.to.toDateString()}`,
      totalExpenses: formatCurrency(analytics.totalExpenses),
      totalIncome: formatCurrency(analytics.totalIncome),
      netBalance: formatCurrency(analytics.netBalance),
      transactionCount: analytics.transactionCount,
      avgDailySpend: formatCurrency(analytics.avgDailySpend),
      avgMonthlySpend: formatCurrency(analytics.avgMonthlySpend),
      topCategories: analytics.categories.slice(0, 5).map((c) => ({
        name: c.category,
        amount: formatCurrency(c.total),
        percentage: c.percentage.toFixed(1) + '%',
      })),
      recurringExpenses: analytics.recurringExpenses.slice(0, 5).map((r) => ({
        name: r.description,
        avgAmount: formatCurrency(r.avgAmount),
        frequency: r.frequency,
      })),
      spendingTrend: analytics.monthly.slice(-3).map((m) => ({
        month: m.label,
        expenses: formatCurrency(m.expenses),
      })),
    }

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, summary }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setInsights(data.insights)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* API Key input */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">{t('ai.title')}</h3>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('ai.keyPlaceholder')}
            className="input"
          />
          <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-fg))]">
            <Shield className="w-3.5 h-3.5" />
            {t('ai.keyInfo')}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!apiKey || !analytics || loading}
          className="btn-primary"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('ai.generating')}</>
          ) : (
            <><Sparkles className="w-4 h-4" />{t('ai.generate')}</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold">AI Analysis</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {insights.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h3>
              if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h2>
              if (line.startsWith('- ') || line.startsWith('* ')) return (
                <div key={i} className="flex items-start gap-2 my-1">
                  <span className="text-brand-500 mt-1">•</span>
                  <span className="text-sm">{line.slice(2)}</span>
                </div>
              )
              if (line.match(/^\d+\. /)) return (
                <div key={i} className="flex items-start gap-2 my-1">
                  <span className="text-brand-500 font-medium text-sm">{line.match(/^\d+/)?.[0]}.</span>
                  <span className="text-sm">{line.replace(/^\d+\. /, '')}</span>
                </div>
              )
              if (!line.trim()) return <div key={i} className="h-2" />
              return <p key={i} className="text-sm text-[hsl(var(--foreground))] my-1">{line}</p>
            })}
          </div>
        </motion.div>
      )}

      {!analytics && (
        <div className="card p-12 text-center text-[hsl(var(--muted-fg))]">
          Load your financial data first to generate AI insights.
        </div>
      )}
    </div>
  )
}
