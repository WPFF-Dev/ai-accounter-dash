import { parseDate, parseAmount, getCategoryColor, groupBy, sumBy } from './utils'
import type {
  Transaction,
  ColumnMap,
  AnalyticsSummary,
  DateRange,
  CategorySummary,
  MonthlyData,
  DailyData,
  WeekdayData,
  RecurringExpense,
} from '@/types'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  differenceInCalendarDays,
  getDay,
} from 'date-fns'

// ─── Row → Transaction ────────────────────────────────────────────────────

let _idCounter = 0
function nextId() { return `txn_${++_idCounter}` }

const INCOME_KEYWORDS = /^(income|salary|revenue|payment received|received|credit|deposit|earning|wage|bonus|refund)/i
const EXPENSE_KEYWORDS = /^(expense|debit|charge|payment|withdrawal|spend|cost)/i

export function normalizeRows(
  rows: string[][],
  headers: string[],
  columnMap: ColumnMap,
  amountSign: 'positive_expense' | 'negative_expense' | 'has_sign',
  tabName: string,
  hasIncome: boolean
): Transaction[] {
  const transactions: Transaction[] = []

  const colIdx = (col: string): number => headers.indexOf(col)
  const get = (row: string[], col?: string): string => {
    if (!col) return ''
    const i = colIdx(col)
    return i >= 0 ? (row[i] ?? '').trim() : ''
  }

  const headerRow = headers
  const dataRows = rows.filter((row) => {
    // Skip empty rows and rows that look like headers
    if (!row || row.length === 0) return false
    const dateVal = get(row, columnMap.date)
    if (!dateVal) return false
    // Skip if this row IS the header
    if (columnMap.date && row[colIdx(columnMap.date)]?.trim() === columnMap.date) return false
    return true
  })

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const dateStr = get(row, columnMap.date)
    const date = parseDate(dateStr)
    if (!date) continue

    const rawAmount = get(row, columnMap.amount)
    if (!rawAmount) continue

    const amount = Math.abs(parseAmount(rawAmount))
    if (amount === 0) continue

    const description = get(row, columnMap.description) || 'Unknown'
    const category = get(row, columnMap.category) || 'Uncategorized'
    const currency = get(row, columnMap.currency) || 'USD'
    const paymentMethod = get(row, columnMap.paymentMethod) || undefined

    // Determine income vs expense
    let isExpense = true
    if (hasIncome) {
      if (columnMap.type) {
        const typeVal = get(row, columnMap.type).toLowerCase()
        isExpense = !INCOME_KEYWORDS.test(typeVal)
      } else if (amountSign === 'has_sign') {
        const raw = parseAmount(rawAmount)
        isExpense = raw < 0 ? false : true // negative = income, positive = expense
      } else if (amountSign === 'negative_expense') {
        const raw = parseAmount(rawAmount)
        isExpense = raw < 0
      } else {
        isExpense = !INCOME_KEYWORDS.test(description)
      }
    }

    transactions.push({
      id: nextId(),
      date,
      dateStr,
      description: description.replace(/\n/g, ' '),
      category: category.replace(/\n/g, ' '),
      amount,
      isExpense,
      currency,
      paymentMethod,
      tab: tabName,
      rowIndex: i,
    })
  }

  return transactions
}

// ─── Build analytics summary ──────────────────────────────────────────────

export function buildAnalytics(
  transactions: Transaction[],
  dateRange: DateRange
): AnalyticsSummary {
  const filtered = transactions.filter(
    (t) => t.date >= dateRange.from && t.date <= dateRange.to
  )

  const expenses = filtered.filter((t) => t.isExpense)
  const income = filtered.filter((t) => !t.isExpense)

  const totalExpenses = sumBy(expenses, (t) => t.amount)
  const totalIncome = sumBy(income, (t) => t.amount)
  const netBalance = totalIncome - totalExpenses

  // Days in range
  const days = Math.max(1, differenceInCalendarDays(dateRange.to, dateRange.from) + 1)
  const months = Math.max(1, days / 30)

  const avgDailySpend = totalExpenses / days
  const avgMonthlySpend = totalExpenses / months

  // Categories
  const catGroups = groupBy(expenses, (t) => t.category || 'Uncategorized')
  const categories: CategorySummary[] = Object.entries(catGroups)
    .map(([category, txns], idx) => ({
      category,
      total: sumBy(txns, (t) => t.amount),
      count: txns.length,
      percentage: totalExpenses > 0 ? (sumBy(txns, (t) => t.amount) / totalExpenses) * 100 : 0,
      color: getCategoryColor(idx),
    }))
    .sort((a, b) => b.total - a.total)

  const topCategory = categories[0]?.category ?? ''
  const topCategoryAmount = categories[0]?.total ?? 0

  // Largest transaction
  const largestTransaction = expenses.reduce(
    (max, t) => (!max || t.amount > max.amount ? t : max),
    null as Transaction | null
  )

  // Monthly data
  const monthGroups = groupBy(filtered, (t) => format(t.date, 'yyyy-MM'))
  const monthly: MonthlyData[] = Object.entries(monthGroups)
    .map(([month, txns]) => {
      const exp = sumBy(txns.filter((t) => t.isExpense), (t) => t.amount)
      const inc = sumBy(txns.filter((t) => !t.isExpense), (t) => t.amount)
      return {
        month,
        label: format(new Date(month + '-01'), 'MMM yyyy'),
        expenses: exp,
        income: inc,
        net: inc - exp,
        count: txns.length,
      }
    })
    .sort((a, b) => a.month.localeCompare(b.month))

  // Daily data (for time series)
  const dailyGroups = groupBy(expenses, (t) => format(t.date, 'yyyy-MM-dd'))
  let cumulative = 0
  const daily: DailyData[] = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
    .map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const dayExpenses = sumBy(dailyGroups[key] ?? [], (t) => t.amount)
      const dayIncome = sumBy(
        groupBy(income, (t) => format(t.date, 'yyyy-MM-dd'))[key] ?? [],
        (t) => t.amount
      )
      cumulative += dayExpenses
      return { date: key, expenses: dayExpenses, income: dayIncome, cumulative }
    })

  // Weekday breakdown
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdayGroups = groupBy(expenses, (t) => String(getDay(t.date)))
  const weekdays: WeekdayData[] = DAYS.map((day, idx) => {
    const txns = weekdayGroups[String(idx)] ?? []
    const total = sumBy(txns, (t) => t.amount)
    return {
      day,
      dayIndex: idx,
      expenses: total,
      count: txns.length,
      avg: txns.length > 0 ? total / txns.length : 0,
    }
  })

  // Recurring expenses detection
  const recurringExpenses = detectRecurring(expenses)

  // Anomalies (transactions > 2 std deviations from mean)
  const anomalies = detectAnomalies(expenses)

  return {
    totalExpenses,
    totalIncome,
    netBalance,
    transactionCount: filtered.length,
    avgDailySpend,
    avgMonthlySpend,
    topCategory,
    topCategoryAmount,
    largestTransaction,
    dateRange,
    categories,
    monthly,
    daily,
    weekdays,
    recurringExpenses,
    anomalies,
  }
}

// ─── Recurring expense detection ─────────────────────────────────────────

function detectRecurring(expenses: Transaction[]): RecurringExpense[] {
  const groups = groupBy(expenses, (t) => t.description.toLowerCase().slice(0, 30))
  const recurring: RecurringExpense[] = []

  for (const [, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue
    const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime())
    const avgAmount = sumBy(sorted, (t) => t.amount) / sorted.length

    // Check spacing between transactions
    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(differenceInCalendarDays(sorted[i].date, sorted[i - 1].date))
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

    let frequency: RecurringExpense['frequency'] | null = null
    if (avgGap >= 25 && avgGap <= 35) frequency = 'monthly'
    else if (avgGap >= 6 && avgGap <= 9) frequency = 'weekly'
    else if (avgGap >= 13 && avgGap <= 18) frequency = 'bi-weekly'

    if (frequency && sorted.length >= 2) {
      recurring.push({
        description: sorted[0].description,
        category: sorted[0].category,
        avgAmount,
        frequency,
        occurrences: sorted.length,
        lastDate: sorted[sorted.length - 1].date,
      })
    }
  }

  return recurring.sort((a, b) => b.avgAmount - a.avgAmount).slice(0, 10)
}

// ─── Anomaly detection ────────────────────────────────────────────────────

function detectAnomalies(expenses: Transaction[]): Transaction[] {
  if (expenses.length < 5) return []
  const amounts = expenses.map((t) => t.amount)
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length
  const std = Math.sqrt(variance)
  const threshold = mean + 2 * std
  return expenses
    .filter((t) => t.amount > threshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
}

// ─── Build comparison data ────────────────────────────────────────────────

export function buildComparison(
  transactions: Transaction[],
  range1: DateRange,
  range2: DateRange
) {
  const build = (range: DateRange, label: string) => {
    const s = buildAnalytics(transactions, range)
    return {
      label,
      expenses: s.totalExpenses,
      income: s.totalIncome,
      net: s.netBalance,
      categories: s.categories,
    }
  }

  const p1 = build(range1, format(range1.from, 'MMM yyyy'))
  const p2 = build(range2, format(range2.from, 'MMM yyyy'))

  const expenseDiff = p2.expenses - p1.expenses
  const expenseDiffPct = p1.expenses > 0 ? (expenseDiff / p1.expenses) * 100 : 0
  const incomeDiff = p2.income - p1.income
  const netDiff = p2.net - p1.net

  return { period1: p1, period2: p2, expenseDiff, expenseDiffPct, incomeDiff, netDiff }
}
