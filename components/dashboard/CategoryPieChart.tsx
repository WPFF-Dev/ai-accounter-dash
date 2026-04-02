'use client'

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
  expanded?: boolean
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: { name: string; value: number; payload: { percentage: number; color: string } }[]
}) {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="card p-3 shadow-card-hover text-sm min-w-[160px]">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
        <span className="font-medium">{name}</span>
      </div>
      <div className="tabular-nums">{formatCurrency(value)}</div>
      <div className="text-[hsl(var(--muted-fg))] text-xs">{p.percentage.toFixed(1)}%</div>
    </div>
  )
}

export default function CategoryPieChart({ analytics, loading, expanded }: Props) {
  const { t } = useI18n()
  const size = expanded ? 300 : 200
  const data = analytics?.categories.slice(0, 10) ?? []

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">{t('chart.categories')}</h3>
      {loading ? (
        <div className="animate-pulse bg-[hsl(var(--muted))] rounded-full mx-auto" style={{ width: size, height: size }} />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center text-[hsl(var(--muted-fg))] text-sm" style={{ height: size }}>
          {t('common.noData')}
        </div>
      ) : (
        <div className={expanded ? 'flex flex-col lg:flex-row gap-6 items-center' : ''}>
          <ResponsiveContainer width={expanded ? '50%' : '100%'} height={size}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={size * 0.3}
                outerRadius={size * 0.45}
                paddingAngle={2}
                dataKey="total"
                nameKey="category"
              >
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className={`space-y-2 ${expanded ? 'flex-1' : 'mt-3'}`}>
            {data.slice(0, 8).map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="text-sm flex-1 truncate">{cat.category}</span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(cat.total)}</span>
                <span className="text-xs text-[hsl(var(--muted-fg))] w-10 text-right tabular-nums">
                  {cat.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
