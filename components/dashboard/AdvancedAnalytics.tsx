'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
}

export default function AdvancedAnalytics({ analytics, loading }: Props) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-5 h-64 animate-pulse bg-[hsl(var(--muted))]" />
        ))}
      </div>
    )
  }

  if (!analytics) return (
    <div className="card p-12 text-center text-[hsl(var(--muted-fg))]">{t('common.noData')}</div>
  )

  const { weekdays, currency = 'USD' } = analytics
  const maxWeekday = Math.max(...weekdays.map((w) => w.expenses), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Day of Week */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h3 className="font-semibold mb-4">{t('chart.weekday')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdays} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
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
              <Tooltip
                formatter={(v: number) => [formatCurrency(v, currency), 'Expenses']}
                contentStyle={{
                  background: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="expenses" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {weekdays.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.expenses === maxWeekday ? '#3B82F6' : '#3B82F640'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Transaction Count by Day */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card p-5">
          <h3 className="font-semibold mb-4">Transaction Frequency by Day</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdays} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-fg))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v, 'Transactions']}
                contentStyle={{
                  background: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Avg spend per transaction by weekday */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card p-5">
        <h3 className="font-semibold mb-4">Average Transaction Size by Day</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((w) => (
            <div key={w.day} className="text-center space-y-2">
              <div className="text-xs text-[hsl(var(--muted-fg))]">{w.day}</div>
              <div className="relative mx-auto w-12">
                <div className="h-20 bg-[hsl(var(--muted))] rounded-lg overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${maxWeekday > 0 ? (w.expenses / maxWeekday) * 100 : 0}%`,
                      background: w.avg > 0 ? '#3B82F6' : 'transparent',
                    }}
                  />
                </div>
              </div>
              <div className="text-xs font-medium tabular-nums">
                {w.avg > 0 ? `$${Math.round(w.avg)}` : '–'}
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-fg))]">{w.count} txns</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
