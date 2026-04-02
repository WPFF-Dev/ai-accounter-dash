'use client'

import { TrendingUp, TrendingDown, DollarSign, Activity, CreditCard, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { AnalyticsSummary } from '@/types'

interface Props {
  analytics: AnalyticsSummary | null
  loading: boolean
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
  index,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  loading: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2 mt-1">
          <div className="h-7 w-28 bg-[hsl(var(--muted))] rounded animate-pulse" />
          <div className="h-3 w-20 bg-[hsl(var(--muted))] rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
          {sub && <div className="text-xs text-[hsl(var(--muted-fg))]">{sub}</div>}
        </>
      )}
    </motion.div>
  )
}

export default function OverviewCards({ analytics, loading }: Props) {
  const { t } = useI18n()
  const currency = 'USD'

  const cards = [
    {
      label: t('overview.totalExpenses'),
      value: analytics ? formatCurrency(analytics.totalExpenses, currency) : '–',
      sub: `${analytics?.transactionCount ?? 0} ${t('common.transactions')}`,
      icon: TrendingDown,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    },
    {
      label: t('overview.totalIncome'),
      value: analytics ? formatCurrency(analytics.totalIncome, currency) : '–',
      sub: analytics?.totalIncome ? '' : 'No income tracked',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      label: t('overview.netBalance'),
      value: analytics ? formatCurrency(Math.abs(analytics.netBalance), currency) : '–',
      sub: analytics ? (analytics.netBalance >= 0 ? '▲ Surplus' : '▼ Deficit') : '',
      icon: DollarSign,
      color: analytics?.netBalance >= 0
        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    },
    {
      label: t('overview.avgDaily'),
      value: analytics ? formatCurrency(analytics.avgDailySpend, currency) : '–',
      sub: t('overview.avgMonthly') + ': ' + (analytics ? formatCurrency(analytics.avgMonthlySpend, currency) : '–'),
      icon: Activity,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      label: t('overview.transactions'),
      value: analytics ? formatNumber(analytics.transactionCount) : '–',
      sub: analytics?.topCategory ? `Top: ${analytics.topCategory}` : '',
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      label: 'Top Category',
      value: analytics?.topCategory ?? '–',
      sub: analytics ? formatCurrency(analytics.topCategoryAmount, currency) : '',
      icon: BarChart2,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} loading={loading} index={i} />
      ))}
    </div>
  )
}
