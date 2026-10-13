export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr)
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
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function lastNDays(n) {
  const out = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d)
    day.setDate(d.getDate() - i)
    out.push(day.toISOString().slice(0, 10))
  }
  return out
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// Simple (unweighted) average of percentage scores for a module, so a quick
// glance answers "roughly where am I sitting". Returns null when there's
// nothing logged yet for that module.
export function computeModuleAverage(grades, moduleId) {
  const list = grades.filter((g) => g.moduleId === moduleId)
  if (list.length === 0) return null
  const total = list.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0)
  return total / list.length
}
