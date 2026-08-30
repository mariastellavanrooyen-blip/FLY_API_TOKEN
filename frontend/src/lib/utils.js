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

// Whole calendar days between today and dateStr (negative if in the past).
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

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// First-of-month date string for a given year + month name, used as the
// placeholder countdown target while an exam date is still "tentative".
export function firstOfMonth(year, monthName) {
  const idx = MONTH_NAMES.indexOf(monthName)
  if (idx < 0) return null
  return `${year}-${String(idx + 1).padStart(2, '0')}-01`
}

// Picks the nearest upcoming occurrence of monthName (this year, or next
// year if that month has already passed) so a tentative exam always counts
// down to a sensible future date.
export function nearestFutureMonthStart(monthName) {
  const now = new Date()
  const thisYear = firstOfMonth(now.getFullYear(), monthName)
  if (thisYear && thisYear >= todayKey()) return thisYear
  return firstOfMonth(now.getFullYear() + 1, monthName)
}

// An exam's effective countdown target: its confirmed date if set, otherwise
// the 1st of its tentative month (rolled to next year if that month has
// already passed) so the countdown always has *something* to count down to.
export function examTargetDate(exam) {
  if (exam.date) return exam.date
  if (exam.tentativeMonth) return nearestFutureMonthStart(exam.tentativeMonth)
  return null
}

export function formatMinutes(mins) {
  const n = Math.max(0, Math.round(mins || 0))
  const h = Math.floor(n / 60)
  const m = n % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// --- categorical color assignment (subjects, study methods) ---
// Fixed, CVD-validated hue order (see theme.css --cat-1..8 / dataviz skill).
// Assigned by an item's position in its owning list, so it stays stable as
// long as the list isn't reordered.
const COLOR_SLOTS = ['--cat-1', '--cat-2', '--cat-3', '--cat-4', '--cat-5', '--cat-6', '--cat-7', '--cat-8']

export function colorVarByIndex(idx) {
  return `var(${COLOR_SLOTS[Math.max(0, idx) % COLOR_SLOTS.length]})`
}

export function subjectColorVar(subjects, subjectId) {
  const idx = subjects.findIndex((s) => s.id === subjectId)
  return colorVarByIndex(idx)
}

export function subjectName(subjects, subjectId) {
  return subjects.find((s) => s.id === subjectId)?.name || 'General'
}

export const EVENT_TYPES = [
  { id: 'study', label: 'Study session', emoji: '📖', color: 'var(--indigo)' },
  { id: 'exam', label: 'Exam', emoji: '🎯', color: 'var(--coral)' },
  { id: 'deadline', label: 'Deadline', emoji: '⏰', color: 'var(--amber)' },
  { id: 'other', label: 'Other', emoji: '📌', color: 'var(--teal)' },
]

export function eventTypeMeta(id) {
  return EVENT_TYPES.find((t) => t.id === id) || EVENT_TYPES[3]
}

export const DEFAULT_METHODS = [
  { id: 'active-recall', name: 'Active Recall', hint: 'Close the book and force yourself to retrieve the answer from memory.' },
  { id: 'spaced-repetition', name: 'Spaced Repetition', hint: 'Revisit chapters at growing intervals (1 day, 3 days, a week…) instead of cramming once.' },
  { id: 'practice-questions', name: 'Practice Questions', hint: "Past papers or made-up questions — tests what you'd actually be asked." },
  { id: 'flashcards', name: 'Flashcards', hint: 'Bite-sized Q&A cards, great for facts, dates and definitions.' },
  { id: 'summarizing', name: 'Summarizing / Notes', hint: 'Rewrite the chapter in your own words — condensing forces understanding.' },
  { id: 'mind-mapping', name: 'Mind Mapping', hint: 'Draw the connections between ideas visually.' },
  { id: 'teaching', name: 'Teaching Others', hint: 'Explain the material out loud as if teaching someone — gaps become obvious fast.' },
  { id: 're-reading', name: 'Re-reading', hint: 'Reading the material again — comfortable, but usually the least effective on its own.' },
]
