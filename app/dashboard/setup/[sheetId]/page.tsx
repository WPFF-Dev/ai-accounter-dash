'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Wand2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { saveSheetConfig, loadSheetConfig } from '@/lib/storage'
import { autoDetectColumns } from '@/lib/column-detector'
import type { SheetTab, SheetStructureType, ColumnMap, SheetConfig } from '@/types'

const REQUIRED_COLS: Array<{ key: keyof ColumnMap; labelKey: string; required: boolean }> = [
  { key: 'date',          labelKey: 'setup.col.date',        required: true },
  { key: 'description',   labelKey: 'setup.col.description', required: true },
  { key: 'category',      labelKey: 'setup.col.category',    required: true },
  { key: 'amount',        labelKey: 'setup.col.amount',      required: true },
  { key: 'currency',      labelKey: 'setup.col.currency',    required: false },
  { key: 'paymentMethod', labelKey: 'setup.col.payment',     required: false },
  { key: 'type',          labelKey: 'setup.col.type',        required: false },
]

export default function SetupPage() {
  const { sheetId } = useParams<{ sheetId: string }>()
  const searchParams = useSearchParams()
  const sheetName = searchParams.get('name') ?? 'Spreadsheet'
  const router = useRouter()
  const { t } = useI18n()

  const [tabs, setTabs] = useState<SheetTab[]>([])
  const [structureType, setStructureType] = useState<SheetStructureType>('flat')
  const [selectedTabs, setSelectedTabs] = useState<string[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    date: '', description: '', category: '', amount: '',
  })
  const [amountSign, setAmountSign] = useState<SheetConfig['amountSign']>('positive_expense')
  const [hasIncome, setHasIncome] = useState(false)
  const [autoDetected, setAutoDetected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Load tabs
  useEffect(() => {
    const go = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/sheets/${sheetId}/tabs`)
        const data = await res.json()
        setTabs(data.tabs ?? [])
        setStructureType(data.structureType ?? 'flat')

        // Pre-select all tabs
        const allTabNames = (data.tabs ?? []).map((t: SheetTab) => t.title)
        setSelectedTabs(allTabNames)

        // Check for existing config
        const existing = loadSheetConfig(sheetId)
        if (existing) {
          setStructureType(existing.structureType)
          setSelectedTabs(existing.selectedTabs)
          setColumnMap(existing.columnMap)
          setAmountSign(existing.amountSign)
          setHasIncome(existing.hasIncome)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    go()
  }, [sheetId])

  // Fetch headers when selectedTabs changes (use first selected tab)
  const fetchHeaders = useCallback(async (tabName: string) => {
    try {
      const res = await fetch(`/api/sheets/${sheetId}/data?tab=${encodeURIComponent(tabName)}`)
      const data = await res.json()
      if (data.headers?.length) {
        setHeaders(data.headers)
        // Auto-detect columns
        const detected = autoDetectColumns(data.headers)
        const newMap: ColumnMap = { date: '', description: '', category: '', amount: '' }
        const detectedKeys = new Set<string>()
        for (const [field, header] of Object.entries(detected)) {
          if (header) {
            ;(newMap as unknown as Record<string, string>)[field] = header
            detectedKeys.add(field)
          }
        }
        setColumnMap((prev) => ({ ...newMap, ...Object.fromEntries(
          Object.entries(prev).filter(([, v]) => v)
        )}))
        setAutoDetected(detectedKeys)
      }
    } catch (e) {
      console.error(e)
    }
  }, [sheetId])

  useEffect(() => {
    if (selectedTabs.length > 0 && step === 2) {
      fetchHeaders(selectedTabs[0])
    }
  }, [selectedTabs, step, fetchHeaders])

  const toggleTab = (name: string) => {
    setSelectedTabs((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const config: SheetConfig = {
      sheetId,
      sheetName,
      structureType,
      selectedTabs,
      columnMap,
      amountSign,
      hasIncome,
      savedAt: new Date().toISOString(),
    }
    saveSheetConfig(config)
    setTimeout(() => {
      router.push(`/dashboard/analytics/${sheetId}`)
    }, 300)
  }

  const canProceedStep1 = selectedTabs.length > 0
  const canProceedStep2 = !!columnMap.date && !!columnMap.amount && !!columnMap.description

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-16 animate-pulse bg-[hsl(var(--muted))]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/sheets')}
          className="btn-ghost mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold">{t('setup.title')}</h1>
        <p className="text-[hsl(var(--muted-fg))] mt-1">{sheetName}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step >= s ? 'bg-brand-500 text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-fg))]'}`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 transition-colors ${step > s ? 'bg-brand-500' : 'bg-[hsl(var(--border))]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Structure & Tabs */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold">{t('setup.structure')}</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['yearly', 'monthly', 'flat'] as SheetStructureType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setStructureType(type)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all
                    ${structureType === type
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted-fg))]'}`}
                >
                  {t(`setup.structure.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold">{t('setup.tabs')}</h2>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.title}
                  onClick={() => toggleTab(tab.title)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${selectedTabs.includes(tab.title)
                      ? 'bg-brand-500 text-white'
                      : 'bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]'}`}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="btn-primary w-full justify-center py-3"
          >
            {t('common.next')}
          </button>
        </motion.div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t('setup.columns')}</h2>
              <div className="flex items-center gap-1.5 text-xs text-brand-500">
                <Wand2 className="w-3.5 h-3.5" />
                {t('setup.autoDetected')}
              </div>
            </div>

            <div className="space-y-3">
              {REQUIRED_COLS.map(({ key, labelKey, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">
                    {t(labelKey)}
                    {required && <span className="text-red-500 ml-1">*</span>}
                    {autoDetected.has(key) && (
                      <span className="ml-2 text-xs text-brand-500">✓ auto</span>
                    )}
                  </label>
                  <select
                    value={(columnMap as Record<string, string>)[key] ?? ''}
                    onChange={(e) => setColumnMap((p) => ({ ...p, [key]: e.target.value }))}
                    className="select"
                  >
                    <option value="">{t('setup.selectColumn')}</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h || '(empty)'}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold">{t('setup.amountSign')}</h2>
            <div className="space-y-2">
              {(['positive_expense', 'negative_expense', 'has_sign'] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="amountSign"
                    value={opt}
                    checked={amountSign === opt}
                    onChange={() => setAmountSign(opt)}
                    className="accent-brand-500"
                  />
                  <span className="text-sm">{t(`setup.amountSign.${opt}`)}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-[hsl(var(--border))]">
              <input
                type="checkbox"
                checked={hasIncome}
                onChange={(e) => setHasIncome(e.target.checked)}
                className="accent-brand-500 w-4 h-4"
              />
              <span className="text-sm">{t('setup.hasIncome')}</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">{t('common.back')}</button>
            <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="btn-primary flex-1 justify-center">{t('common.next')}</button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review & Save */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Review Configuration</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-fg))]">Structure</span>
                <span className="font-medium">{t(`setup.structure.${structureType}`)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-fg))]">Tabs selected</span>
                <span className="font-medium">{selectedTabs.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-fg))]">Date column</span>
                <span className="font-medium">{columnMap.date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--muted-fg))]">Amount column</span>
                <span className="font-medium">{columnMap.amount}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[hsl(var(--muted-fg))]">Has income</span>
                <span className="font-medium">{hasIncome ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center">{t('common.back')}</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center py-3">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.loading')}</>
              ) : t('setup.save')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
