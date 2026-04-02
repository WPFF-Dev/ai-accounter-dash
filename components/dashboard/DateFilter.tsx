'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import type { DateRange, DateRangePreset } from '@/types'
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, subYears, startOfDay, endOfDay
} from 'date-fns'

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS: { value: DateRangePreset; labelKey: string }[] = [
  { value: 'this_month',   labelKey: 'filter.thisMonth' },
  { value: 'last_month',   labelKey: 'filter.lastMonth' },
  { value: 'last_3_months', labelKey: 'filter.last3Months' },
  { value: 'last_6_months', labelKey: 'filter.last6Months' },
  { value: 'this_year',    labelKey: 'filter.thisYear' },
  { value: 'last_year',    labelKey: 'filter.lastYear' },
  { value: 'custom',       labelKey: 'filter.custom' },
]

function getRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  switch (preset) {
    case 'this_month':    return { from: startOfMonth(now), to: endOfMonth(now), preset }
    case 'last_month': {
      const lm = subMonths(now, 1)
      return { from: startOfMonth(lm), to: endOfMonth(lm), preset }
    }
    case 'last_3_months': return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now), preset }
    case 'last_6_months': return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now), preset }
    case 'this_year':     return { from: startOfYear(now), to: endOfYear(now), preset }
    case 'last_year': {
      const ly = subYears(now, 1)
      return { from: startOfYear(ly), to: endOfYear(ly), preset }
    }
    default: return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export default function DateFilter({ value, onChange }: Props) {
  const { t } = useI18n()
  const [showCustom, setShowCustom] = useState(value.preset === 'custom')

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onChange(getRange(preset))
  }

  const handleCustom = (field: 'from' | 'to', val: string) => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return
    onChange({
      ...value,
      [field]: field === 'from' ? startOfDay(date) : endOfDay(date),
      preset: 'custom',
    })
  }

  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="w-4 h-4 text-[hsl(var(--muted-fg))] shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ value: preset, labelKey }) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${value.preset === preset
                  ? 'bg-brand-500 text-white'
                  : 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))]'
                }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Date range display */}
        <div className="ml-auto text-xs text-[hsl(var(--muted-fg))] tabular-nums">
          {format(value.from, 'MMM d, yyyy')} – {format(value.to, 'MMM d, yyyy')}
        </div>
      </div>

      {/* Custom range inputs */}
      {showCustom && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-[hsl(var(--muted-fg))] shrink-0">{t('filter.from')}</label>
            <input
              type="date"
              value={format(value.from, 'yyyy-MM-dd')}
              onChange={(e) => handleCustom('from', e.target.value)}
              className="input py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-[hsl(var(--muted-fg))] shrink-0">{t('filter.to')}</label>
            <input
              type="date"
              value={format(value.to, 'yyyy-MM-dd')}
              onChange={(e) => handleCustom('to', e.target.value)}
              className="input py-1 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
