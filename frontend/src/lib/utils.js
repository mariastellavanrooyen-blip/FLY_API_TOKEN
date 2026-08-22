export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(todayKey() + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// --- money ---

export function formatMoney(amount, symbol = '$') {
  const n = Number(amount) || 0
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// --- month helpers (all "monthKey" values are 'YYYY-MM') ---

export function monthKeyOf(dateStr) {
  return (dateStr || todayKey()).slice(0, 7)
}

export function currentMonthKey() {
  return monthKeyOf(todayKey())
}

export function addMonths(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

// Advance a date string to the same day-of-month next month (used for
// recurring shopping trips) — clamps to the last day if the next month is
// shorter (e.g. the 31st rolling into February).
export function nextMonthSameDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, lastDay))
  return todayKey(next)
}

// Calendar grid: array of cells (42 = 6 weeks) for the given monthKey, each
// either null (padding before/after the month) or a 'YYYY-MM-DD' string.
export function calendarCells(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const startPad = first.getDay() // 0 = Sunday
  const daysInMonth = new Date(y, m, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// --- categorical color assignment for budget categories ---
// Fixed, CVD-validated order (see theme.css --cat-1..8 / dataviz skill).
// Assigned by each category's position in the settings list so it stays
// stable as long as categories aren't reordered.
const CATEGORY_SLOTS = ['--cat-1', '--cat-2', '--cat-3', '--cat-4', '--cat-5', '--cat-6', '--cat-7', '--cat-8']

export function categoryColorVar(categories, name) {
  const idx = Math.max(0, categories.indexOf(name))
  return `var(${CATEGORY_SLOTS[idx % CATEGORY_SLOTS.length]})`
}

export const EVENT_CATEGORIES = [
  { id: 'household', label: 'Household', color: 'var(--sage)' },
  { id: 'kids', label: 'Kids', color: 'var(--mustard)' },
  { id: 'appointment', label: 'Appointment', color: 'var(--sky, #6e9bb0)' },
  { id: 'other', label: 'Other', color: 'var(--ink-soft)' },
]

export function eventCategoryMeta(id) {
  return EVENT_CATEGORIES.find((c) => c.id === id) || EVENT_CATEGORIES[3]
}
