'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Repeat, AlertTriangle, Trophy } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatDate, truncate } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
}

export default function InsightsPanel({ analytics, loading }: Props) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-48 animate-pulse bg-[hsl(var(--muted))]" />
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="card p-12 text-center text-[hsl(var(--muted-fg))]">{t('common.noData')}</div>
    )
  }

  const { categories, largestTransaction, recurringExpenses, anomalies, monthly, currency = 'USD' } = analytics

  // Calculate month-over-month trend
  const trend = monthly.length >= 2
    ? ((monthly[monthly.length - 1].expenses - monthly[monthly.length - 2].expenses)
       / Math.max(1, monthly[monthly.length - 2].expenses)) * 100
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Categories */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold">{t('insights.topCategories')}</h3>
        </div>
        <div className="space-y-3">
          {categories.slice(0, 6).map((cat, i) => (
            <div key={cat.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(var(--muted-fg))] w-5 text-xs">{i + 1}.</span>
                  <span className="font-medium truncate max-w-[160px]">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[hsl(var(--muted-fg))]">{cat.percentage.toFixed(0)}%</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(cat.total, currency)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percentage}%`, background: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Largest Transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold">{t('insights.largest')}</h3>
        </div>
        <div className="space-y-3">
          {anomalies.length === 0 && largestTransaction && (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No unusual transactions detected.</div>
          )}
          {anomalies.slice(0, 5).map((txn) => (
            <div key={txn.id} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{truncate(txn.description, 32)}</div>
                <div className="text-xs text-[hsl(var(--muted-fg))]">
                  {txn.category} · {formatDate(txn.date)}
                </div>
              </div>
              <span className="text-sm font-bold text-red-500 tabular-nums shrink-0">
                {formatCurrency(txn.amount, currency)}
              </span>
            </div>
          ))}
          {anomalies.length === 0 && !largestTransaction && (
            <div className="text-sm text-[hsl(var(--muted-fg))]">
              Not enough data for anomaly detection.
            </div>
          )}
        </div>
      </motion.div>

      {/* Recurring Expenses */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">{t('insights.recurring')}</h3>
        </div>
        {recurringExpenses.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No recurring expenses detected.</div>
        ) : (
          <div className="space-y-3">
            {recurringExpenses.slice(0, 5).map((r) => (
              <div key={r.description} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{truncate(r.description, 30)}</div>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">
                    {r.frequency} · {r.occurrences}× · {r.category}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  ~{formatCurrency(r.avgAmount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Spending Trends */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold">{t('insights.trends')}</h3>
        </div>
        <div className="space-y-3">
          {trend !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              trend > 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'
            }`}>
              {trend > 0
                ? <TrendingUp className="w-4 h-4 text-red-500" />
                : <TrendingDown className="w-4 h-4 text-green-600" />
              }
              <span className="text-sm">
                Spending {trend > 0 ? 'increased' : 'decreased'} by{' '}
                <strong className={trend > 0 ? 'text-red-600' : 'text-green-600'}>
                  {Math.abs(trend).toFixed(1)}%
                </strong>{' '}
                vs last month
              </span>
            </div>
          )}

          {monthly.length > 0 && (
            <>
              <div className="text-sm">
                <span className="text-[hsl(var(--muted-fg))]">Best month: </span>
                <strong>{monthly.reduce((a, b) => a.expenses < b.expenses ? a : b).label}</strong>
                <span className="text-[hsl(var(--muted-fg))]"> ({formatCurrency(Math.min(...monthly.map((m) => m.expenses)), currency)})</span>
              </div>
              <div className="text-sm">
                <span className="text-[hsl(var(--muted-fg))]">Highest month: </span>
                <strong>{monthly.reduce((a, b) => a.expenses > b.expenses ? a : b).label}</strong>
                <span className="text-[hsl(var(--muted-fg))]"> ({formatCurrency(Math.max(...monthly.map((m) => m.expenses)), currency)})</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
