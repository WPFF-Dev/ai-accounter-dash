// ─── Auth ───────────────────────────────────────────────────────────────────

import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
  }
}

// ─── Google Drive / Sheets ───────────────────────────────────────────────────

export interface GoogleSheet {
  id: string
  name: string
  modifiedTime: string
  thumbnailLink?: string
}

export interface SheetTab {
  title: string
  sheetId: number
  index: number
  rowCount: number
  columnCount: number
}

// ─── Column Mapping ──────────────────────────────────────────────────────────

export type SheetStructureType = 'yearly' | 'monthly' | 'flat'

export interface ColumnMap {
  date: string
  description: string
  category: string
  amount: string
  currency?: string
  paymentMethod?: string
  type?: string          // income / expense indicator column
}

export interface SheetConfig {
  sheetId: string
  sheetName: string
  structureType: SheetStructureType
  selectedTabs: string[]
  columnMap: ColumnMap
  amountSign: 'positive_expense' | 'negative_expense' | 'has_sign'
  hasIncome: boolean
  savedAt: string
}

// ─── Normalized Transaction ──────────────────────────────────────────────────

export interface Transaction {
  id: string
  date: Date
  dateStr: string        // original string
  description: string
  category: string
  amount: number         // always positive
  isExpense: boolean     // true = expense, false = income
  currency: string
  paymentMethod?: string
  tab: string            // source tab name
  rowIndex: number
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type DateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'last_year'
  | 'select_year'
  | 'custom'

export interface DateRange {
  from: Date
  to: Date
  preset?: DateRangePreset
}

export interface CategorySummary {
  category: string
  total: number
  count: number
  percentage: number
  color: string
}

export interface MonthlyData {
  month: string          // 'YYYY-MM'
  label: string          // 'Jan 2024'
  expenses: number
  income: number
  net: number
  count: number
}

export interface DailyData {
  date: string           // 'YYYY-MM-DD'
  expenses: number
  income: number
  cumulative: number
}

export interface WeekdayData {
  day: string
  dayIndex: number
  expenses: number
  count: number
  avg: number
}

export interface AnalyticsSummary {
  totalExpenses: number
  totalIncome: number
  netBalance: number
  transactionCount: number
  avgDailySpend: number
  avgMonthlySpend: number
  topCategory: string
  topCategoryAmount: number
  largestTransaction: Transaction | null
  dateRange: DateRange
  currency: string           // dominant currency detected from transactions
  categories: CategorySummary[]
  monthly: MonthlyData[]
  daily: DailyData[]
  weekdays: WeekdayData[]
  recurringExpenses: RecurringExpense[]
  anomalies: Transaction[]
}

export interface RecurringExpense {
  description: string
  category: string
  avgAmount: number
  frequency: 'monthly' | 'weekly' | 'bi-weekly'
  occurrences: number
  lastDate: Date
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface ComparisonData {
  period1: { label: string; expenses: number; income: number; net: number; categories: CategorySummary[] }
  period2: { label: string; expenses: number; income: number; net: number; categories: CategorySummary[] }
  expenseDiff: number
  expenseDiffPct: number
  incomeDiff: number
  netDiff: number
}

// ─── i18n ────────────────────────────────────────────────────────────────────

export type Locale = 'en' | 'he' | 'ru' | 'uk'
export type Direction = 'ltr' | 'rtl'
