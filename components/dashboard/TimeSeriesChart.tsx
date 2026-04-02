'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Area, AreaChart,
} from 'recharts'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
  expanded?: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 shadow-card-hover text-sm space-y-1 min-w-[160px]">
      <div className="text-[hsl(var(--muted-fg))] text-xs">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="capitalize">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TimeSeriesChart({ analytics, loading, expanded }: Props) {
  const { t } = useI18n()
  const height = expanded ? 360 : 240
  const currency = analytics?.currency ?? 'USD'

  // Aggregate daily data to weekly if too many points
  const raw = analytics?.daily ?? []
  const data = raw.length > 90
    ? aggregateWeekly(raw)
    : raw.map((d) => ({ ...d, label: formatDate(new Date(d.date), 'MMM d') }))

  return (
    <div className={`card p-5 ${expanded ? 'col-span-full' : ''}`}>
      <h3 className="font-semibold mb-4">{t('chart.timeSeries')}</h3>
      {loading ? (
        <div className="animate-pulse bg-[hsl(var(--muted))] rounded-xl" style={{ height }} />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center text-[hsl(var(--muted-fg))] text-sm" style={{ height }}>
          {t('common.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              formatter={(value) => <span className="capitalize text-[hsl(var(--foreground))]">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#expGrad)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            {analytics?.totalIncome && analytics.totalIncome > 0 && (
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#incGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function aggregateWeekly(daily: AnalyticsSummary['daily']) {
  const weeks: Record<string, { label: string; expenses: number; income: number }> = {}
  for (const d of daily) {
    const date = new Date(d.date)
    // Get start of week
    const dow = date.getDay()
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - dow)
    const key = startOfWeek.toISOString().slice(0, 10)
    if (!weeks[key]) {
      weeks[key] = { label: formatDate(startOfWeek, 'MMM d'), expenses: 0, income: 0 }
    }
    weeks[key].expenses += d.expenses
    weeks[key].income += d.income
  }
  return Object.values(weeks)
}
