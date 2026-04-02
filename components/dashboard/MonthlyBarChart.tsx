'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 shadow-card-hover text-sm space-y-1 min-w-[160px]">
      <div className="text-[hsl(var(--muted-fg))] text-xs font-medium mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="capitalize">{p.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyBarChart({ analytics, loading }: Props) {
  const { t } = useI18n()
  const data = analytics?.monthly ?? []
  const hasIncome = data.some((d) => d.income > 0)

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">{t('chart.monthly')}</h3>
      {loading ? (
        <div className="animate-pulse bg-[hsl(var(--muted))] rounded-xl h-60" />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center text-[hsl(var(--muted-fg))] text-sm h-60">
          {t('common.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
              axisLine={false}
              tickLine={false}
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
              formatter={(v) => <span className="capitalize text-[hsl(var(--foreground))]">{v}</span>}
            />
            <Bar dataKey="expenses" name="expenses" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={48} />
            {hasIncome && (
              <Bar dataKey="income" name="income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={48} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
