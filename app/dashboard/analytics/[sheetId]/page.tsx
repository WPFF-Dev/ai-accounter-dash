'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings2, Download, RefreshCw, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { loadSheetConfig } from '@/lib/storage'
import { normalizeRows, buildAnalytics } from '@/lib/data-processor'
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, subYears, startOfDay, endOfDay
} from 'date-fns'
import type { Transaction, AnalyticsSummary, DateRange, DateRangePreset, SheetConfig } from '@/types'
import OverviewCards from '@/components/dashboard/OverviewCards'
import TimeSeriesChart from '@/components/dashboard/TimeSeriesChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyBarChart from '@/components/dashboard/MonthlyBarChart'
import InsightsPanel from '@/components/dashboard/InsightsPanel'
import AdvancedAnalytics from '@/components/dashboard/AdvancedAnalytics'
import DateFilter from '@/components/dashboard/DateFilter'
import ComparisonView from '@/components/dashboard/ComparisonView'
import AIInsights from '@/components/dashboard/AIInsights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

function getPresetRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  switch (preset) {
    case 'this_month':   return { from: startOfMonth(now), to: endOfMonth(now), preset }
    case 'last_month': {
      const lm = subMonths(now, 1)
      return { from: startOfMonth(lm), to: endOfMonth(lm), preset }
    }
    case 'last_3_months': return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now), preset }
    case 'last_6_months': return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now), preset }
    case 'this_year':  return { from: startOfYear(now), to: endOfYear(now), preset }
    case 'last_year': {
      const ly = subYears(now, 1)
      return { from: startOfYear(ly), to: endOfYear(ly), preset }
    }
    default: return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export default function AnalyticsPage() {
  const { sheetId } = useParams<{ sheetId: string }>()
  const router = useRouter()
  const { t } = useI18n()

  const [config, setConfig] = useState<SheetConfig | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange('this_month'))
  const [activeTab, setActiveTab] = useState('overview')
  const [currencyOverride, setCurrencyOverride] = useState<string>('')

  // Load config
  useEffect(() => {
    const cfg = loadSheetConfig(sheetId)
    if (!cfg) {
      router.push(`/dashboard/setup/${sheetId}`)
      return
    }
    setConfig(cfg)
  }, [sheetId, router])

  // Fetch & process data
  const loadData = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sheets/${sheetId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabs: config.selectedTabs }),
      })
      if (!res.ok) throw new Error('Fetch failed')
      const { data } = await res.json()

      const allTransactions: Transaction[] = []
      for (const [tab, { headers, rows }] of Object.entries(data) as [string, { headers: string[]; rows: string[][] }][]) {
        const txns = normalizeRows(
          rows,
          headers,
          config.columnMap,
          config.amountSign,
          tab,
          config.hasIncome
        )
        allTransactions.push(...txns)
      }

      // Sort by date
      allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())
      setTransactions(allTransactions)

      // Auto-set date range to data range if preset
      if (allTransactions.length > 0 && dateRange.preset === 'this_month') {
        const first = allTransactions[0].date
        const last = allTransactions[allTransactions.length - 1].date
        const now = new Date()
        // If data doesn't overlap with current month, switch to data range
        if (last < startOfMonth(now)) {
          setDateRange({ from: startOfMonth(last), to: endOfMonth(last) })
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [config, sheetId, t, dateRange.preset])

  useEffect(() => { loadData() }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  const analytics = useMemo<AnalyticsSummary | null>(() => {
    if (transactions.length === 0) return null
    const result = buildAnalytics(transactions, dateRange)
    // Apply manual currency override if set
    if (currencyOverride) result.currency = currencyOverride
    return result
  }, [transactions, dateRange, currencyOverride])

  // Unique currencies detected across all transactions
  const availableCurrencies = useMemo(() => {
    const seen = new Set<string>()
    for (const t of transactions) {
      const c = t.currency?.trim().toUpperCase()
      if (c) seen.add(c)
    }
    return Array.from(seen).sort()
  }, [transactions])

  // Unique years from transaction data
  const availableYears = useMemo(() => {
    const seen = new Set<number>()
    for (const t of transactions) seen.add(t.date.getFullYear())
    return Array.from(seen).sort((a, b) => b - a)
  }, [transactions])

  const handleExportCSV = () => {
    if (!transactions.length) return
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Currency', 'Payment Method', 'Tab']
    const rows = transactions.map((t) => [
      t.dateStr,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount,
      t.isExpense ? 'Expense' : 'Income',
      t.currency,
      t.paymentMethod ?? '',
      t.tab,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config?.sheetName ?? 'transactions'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!config) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold truncate max-w-md">{config.sheetName}</h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-0.5">
            {transactions.length} {t('common.transactions')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency picker */}
          {availableCurrencies.length > 0 && (
            <select
              value={currencyOverride || analytics?.currency || ''}
              onChange={(e) => setCurrencyOverride(e.target.value)}
              className="select text-xs py-1.5 w-24"
              title={t('common.currency')}
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            <Download className="w-3.5 h-3.5" />
            {t('export.csv')}
          </button>
          <button onClick={loadData} disabled={loading} className="btn-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => router.push(`/dashboard/setup/${sheetId}?name=${encodeURIComponent(config.sheetName)}`)}
            className="btn-secondary text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {t('sheets.configure')}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter value={dateRange} onChange={setDateRange} availableYears={availableYears} />

      {/* Error */}
      {error && (
        <div className="card p-4 flex items-center gap-3 border-red-500/30 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={loadData} className="btn-secondary ml-auto text-xs">{t('common.retry')}</button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {[
            { value: 'overview', label: t('dashboard.overview') },
            { value: 'charts', label: t('dashboard.charts') },
            { value: 'insights', label: t('dashboard.insights') },
            { value: 'advanced', label: t('dashboard.advanced') },
            { value: 'comparison', label: t('dashboard.comparison') },
            { value: 'ai', label: t('dashboard.aiInsights') },
          ].map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <OverviewCards analytics={analytics} loading={loading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeSeriesChart analytics={analytics} loading={loading} />
              <CategoryPieChart analytics={analytics} loading={loading} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="charts">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <TimeSeriesChart analytics={analytics} loading={loading} expanded />
            <MonthlyBarChart analytics={analytics} loading={loading} />
            <CategoryPieChart analytics={analytics} loading={loading} expanded />
          </motion.div>
        </TabsContent>

        <TabsContent value="insights">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <InsightsPanel analytics={analytics} loading={loading} />
          </motion.div>
        </TabsContent>

        <TabsContent value="advanced">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AdvancedAnalytics analytics={analytics} loading={loading} />
          </motion.div>
        </TabsContent>

        <TabsContent value="comparison">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ComparisonView transactions={transactions} />
          </motion.div>
        </TabsContent>

        <TabsContent value="ai">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AIInsights analytics={analytics} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
