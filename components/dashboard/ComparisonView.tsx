'use client'

import { useState, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { buildComparison } from '@/lib/data-processor'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths, subYears } from 'date-fns'
import type { Transaction, DateRange } from '@/types'

interface Props {
  transactions: Transaction[]
}

// Generate year-month options from transactions
function getAvailableMonths(txns: Transaction[]) {
  const seen = new Set<string>()
  for (const t of txns) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    seen.add(key)
  }
  return Array.from(seen).sort().reverse()
}

export default function ComparisonView({ transactions }: Props) {
  const { t } = useI18n()
  const months = useMemo(() => getAvailableMonths(transactions), [transactions])
  const currency = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of transactions) {
      const c = t.currency?.trim().toUpperCase()
      if (c) counts[c] = (counts[c] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD'
  }, [transactions])
  const [period1, setPeriod1] = useState(months[0] ?? '')
  const [period2, setPeriod2] = useState(months[Math.min(12, months.length - 1)] ?? '')

  const comparison = useMemo(() => {
    if (!period1 || !period2 || period1 === period2) return null
    const toRange = (key: string): DateRange => {
      const [y, m] = key.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    return buildComparison(transactions, toRange(period1), toRange(period2))
  }, [transactions, period1, period2])

  const chartData = comparison ? [
    {
      label: 'Expenses',
      [comparison.period1.label]: comparison.period1.expenses,
      [comparison.period2.label]: comparison.period2.expenses,
    },
    {
      label: 'Income',
      [comparison.period1.label]: comparison.period1.income,
      [comparison.period2.label]: comparison.period2.income,
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Period selectors */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">{t('comparison.title')}</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-[hsl(var(--muted-fg))] mb-1.5">
              {t('comparison.period1')}
            </label>
            <select value={period1} onChange={(e) => setPeriod1(e.target.value)} className="select">
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="text-[hsl(var(--muted-fg))] font-semibold pt-4">{t('comparison.vs')}</div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-[hsl(var(--muted-fg))] mb-1.5">
              {t('comparison.period2')}
            </label>
            <select value={period2} onChange={(e) => setPeriod2(e.target.value)} className="select">
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {comparison && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Expenses',
                p1: comparison.period1.expenses,
                p2: comparison.period2.expenses,
                diff: comparison.expenseDiff,
                pct: comparison.expenseDiffPct,
              },
              {
                label: 'Income',
                p1: comparison.period1.income,
                p2: comparison.period2.income,
                diff: comparison.incomeDiff,
                pct: comparison.period1.income > 0
                  ? (comparison.incomeDiff / comparison.period1.income) * 100
                  : 0,
              },
              {
                label: 'Net Balance',
                p1: comparison.period1.net,
                p2: comparison.period2.net,
                diff: comparison.netDiff,
                pct: comparison.period1.net !== 0
                  ? (comparison.netDiff / Math.abs(comparison.period1.net)) * 100
                  : 0,
              },
            ].map(({ label, p1, p2, diff, pct }) => (
              <div key={label} className="card p-4 space-y-3">
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wide">{label}</div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-fg))]">{comparison.period1.label}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(p1, currency)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[hsl(var(--muted-fg))]">{comparison.period2.label}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(p2, currency)}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  diff > 0 ? 'text-red-500' : 'text-green-600'
                }`}>
                  <span>{formatPercent(pct)}</span>
                  <span className="text-xs font-normal text-[hsl(var(--muted-fg))]">
                    ({diff >= 0 ? '+' : ''}{formatCurrency(diff, currency)})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison chart */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Side-by-Side Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-fg))' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, currency)}
                  contentStyle={{
                    background: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(v) => <span className="text-[hsl(var(--foreground))]">{v}</span>}
                />
                <Bar dataKey={comparison.period1.label} fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey={comparison.period2.label} fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[comparison.period1, comparison.period2].map((period) => (
              <div key={period.label} className="card p-5">
                <h4 className="font-semibold mb-3">{period.label}</h4>
                <div className="space-y-2">
                  {period.categories.slice(0, 6).map((cat) => (
                    <div key={cat.category} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                      <span className="flex-1 truncate">{cat.category}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(cat.total, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!comparison && months.length < 2 && (
        <div className="card p-12 text-center text-[hsl(var(--muted-fg))]">
          Need at least 2 months of data for comparison.
        </div>
      )}
    </div>
  )
}
