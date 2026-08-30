import { daysUntil, todayKey } from './utils.js'

// A chapter counts as done once its most recent log entry says so — you can
// log a first pass, then a revision pass, and only the latest marking wins.
export function completedChapters(subjectId, logs) {
  const forSubject = logs.filter((l) => l.subjectId === subjectId && l.chapter)
  const latestBychapter = new Map()
  for (const log of forSubject) {
    const key = log.chapter.trim().toLowerCase()
    const prev = latestBychapter.get(key)
    if (!prev || log.date >= prev.date) latestBychapter.set(key, log)
  }
  return [...latestBychapter.values()].filter((l) => l.completed).length
}

export function subjectStats(subject, logs) {
  const subjectLogs = logs.filter((l) => l.subjectId === subject.id)
  const totalMinutes = subjectLogs.reduce((sum, l) => sum + (Number(l.minutes) || 0), 0)
  const done = completedChapters(subject.id, logs)
  const total = Math.max(0, Number(subject.totalChapters) || 0)
  const progressPct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const daysLeft = subject.targetDate ? daysUntil(subject.targetDate) : null
  const chaptersLeft = Math.max(0, total - done)

  // Pace: how many chapters/day you'd need from here to finish on time,
  // vs. how many chapters/day you've actually been averaging since start.
  let paceNeededPerDay = null
  let onTrack = null
  if (daysLeft !== null) {
    paceNeededPerDay = daysLeft > 0 ? chaptersLeft / daysLeft : chaptersLeft > 0 ? Infinity : 0
    if (chaptersLeft === 0) onTrack = true
    else if (daysLeft < 0) onTrack = false
    else {
      const start = subject.startDate || subject.createdAt || todayKey()
      const elapsedDays = Math.max(1, daysUntil(start) * -1)
      const actualPerDay = done / elapsedDays
      onTrack = actualPerDay >= paceNeededPerDay * 0.85 // small grace margin
    }
  }

  return { totalMinutes, done, total, progressPct, daysLeft, chaptersLeft, paceNeededPerDay, onTrack, sessions: subjectLogs.length }
}

export function minutesInLastDays(logs, days) {
  const cutoff = todayKey()
  const start = new Date(cutoff + 'T00:00:00')
  start.setDate(start.getDate() - days + 1)
  const startKey = start.toISOString().slice(0, 10)
  return logs.filter((l) => l.date >= startKey && l.date <= cutoff).reduce((sum, l) => sum + (Number(l.minutes) || 0), 0)
}

// Groups chapter-log entries by study method and scores each one so you can
// see, empirically, which method is paying off best for you: confidence
// gained per hour invested (not just raw confidence, so a method you barely
// used can't outrank one you've relied on for weeks off a lucky session).
export function methodStats(logs, methods) {
  const byMethod = new Map()
  for (const log of logs) {
    if (!log.method) continue
    if (!byMethod.has(log.method)) byMethod.set(log.method, [])
    byMethod.get(log.method).push(log)
  }
  const rows = [...byMethod.entries()].map(([methodId, entries]) => {
    const totalMinutes = entries.reduce((s, l) => s + (Number(l.minutes) || 0), 0)
    const avgConfidence = entries.reduce((s, l) => s + (Number(l.confidence) || 0), 0) / entries.length
    const hours = totalMinutes / 60
    const efficiency = hours > 0 ? avgConfidence / hours : 0
    const meta = methods.find((m) => m.id === methodId)
    return { methodId, name: meta?.name || methodId, sessions: entries.length, totalMinutes, avgConfidence, efficiency }
  })
  return rows.sort((a, b) => b.avgConfidence - a.avgConfidence)
}

export function bestMethod(logs, methods, minSessions = 3) {
  const rows = methodStats(logs, methods).filter((r) => r.sessions >= minSessions)
  return rows[0] || null
}
