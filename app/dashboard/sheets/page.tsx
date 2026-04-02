'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, RefreshCw, FileSpreadsheet, Clock, Settings2, BarChart3 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { loadAllConfigs } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import type { GoogleSheet } from '@/types'

export default function SheetsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [sheets, setSheets] = useState<GoogleSheet[]>([])
  const [filtered, setFiltered] = useState<GoogleSheet[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const configs = loadAllConfigs()

  const fetchSheets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sheets')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSheets(data.sheets ?? [])
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchSheets() }, [fetchSheets])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(sheets.filter((s) => s.name.toLowerCase().includes(q)))
  }, [search, sheets])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('sheets.title')}</h1>
          <p className="text-[hsl(var(--muted-fg))] mt-1">{t('sheets.subtitle')}</p>
        </div>
        <button onClick={fetchSheets} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-fg))]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('sheets.search')}
          className="input pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-[hsl(var(--muted))] rounded w-3/4" />
              <div className="h-4 bg-[hsl(var(--muted))] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center space-y-3">
          <p className="text-[hsl(var(--muted-fg))]">{error}</p>
          <button onClick={fetchSheets} className="btn-primary">{t('common.retry')}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-[hsl(var(--muted-fg))] mx-auto mb-3" />
          <p className="text-[hsl(var(--muted-fg))]">{t('sheets.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sheet, i) => {
            const configured = !!configs[sheet.id]
            return (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-brand-500 transition-colors">
                      {sheet.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--muted-fg))]">
                      <Clock className="w-3 h-3" />
                      {formatDate(new Date(sheet.modifiedTime), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {configured && (
                    <span className="badge-blue text-xs shrink-0">✓</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/setup/${sheet.id}?name=${encodeURIComponent(sheet.name)}`)}
                    className="flex-1 btn-secondary text-xs py-1.5 justify-center"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {t('sheets.configure')}
                  </button>
                  {configured && (
                    <button
                      onClick={() => router.push(`/dashboard/analytics/${sheet.id}`)}
                      className="flex-1 btn-primary text-xs py-1.5 justify-center"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      {t('sheets.analyze')}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
