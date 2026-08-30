import React, { useMemo } from 'react'
import { useStore } from '../state/store.jsx'
import EmptyState from './ui/EmptyState.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import { subjectStats } from '../lib/studyMath.js'
import { minutesInLastDays } from '../lib/studyMath.js'
import {
  todayKey,
  formatDate,
  subjectColorVar,
  examTargetDate,
  daysUntil,
  formatMinutes,
  eventTypeMeta,
  subjectName,
} from '../lib/utils.js'

export default function Dashboard({ onNavigate }) {
  const { state } = useStore()
  const { settings } = state

  const nearestExam = useMemo(() => {
    return [...state.exams]
      .map((e) => ({ exam: e, target: examTargetDate(e) }))
      .filter((x) => x.target && daysUntil(x.target) >= 0)
      .sort((a, b) => a.target.localeCompare(b.target))[0]
  }, [state.exams])

  const weekMinutes = minutesInLastDays(state.chapterLogs, 7)
  const goalMinutes = (settings.weeklyGoalHours || 0) * 60

  const subjectRows = useMemo(() => state.subjects.map((s) => ({ subject: s, stats: subjectStats(s, state.chapterLogs) })), [state.subjects, state.chapterLogs])
  const onTrackCount = subjectRows.filter((r) => r.stats.onTrack === true).length
  const totalDone = subjectRows.reduce((s, r) => s + r.stats.done, 0)
  const totalChapters = subjectRows.reduce((s, r) => s + r.stats.total, 0)

  const upcomingEvents = useMemo(() => {
    const today = todayKey()
    return state.events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 5)
  }, [state.events])

  return (
    <div>
      {nearestExam ? (
        <div className={`countdown-hero${!nearestExam.exam.date ? ' tentative' : ''}`}>
          <div className="countdown-number">{daysUntil(nearestExam.target)}</div>
          <div className="countdown-body">
            <div className="countdown-title">
              days until {nearestExam.exam.title}
              {nearestExam.exam.subjectId ? ` (${subjectName(state.subjects, nearestExam.exam.subjectId)})` : ''}
            </div>
            <div className="countdown-sub">
              {nearestExam.exam.date
                ? `Confirmed for ${formatDate(nearestExam.exam.date)}`
                : `Estimated from "${nearestExam.exam.tentativeMonth}" — update it once the real date is out.`}
            </div>
          </div>
          <button className="btn secondary small" onClick={() => onNavigate('exams')}>
            Manage exams →
          </button>
        </div>
      ) : (
        <div className="card">
          <EmptyState emoji="🎯" title="No exam countdown yet" subtitle="Add an exam — even with just a rough month like October or November — to start counting down." />
          <div style={{ textAlign: 'center' }}>
            <button className="btn" onClick={() => onNavigate('exams')}>
              + Add an exam
            </button>
          </div>
        </div>
      )}

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <div className="stat-tile">
          <div className="stat-label">Chapters done</div>
          <div className="stat-value">
            {totalDone}/{totalChapters || 0}
          </div>
          <div className="stat-sub">across {state.subjects.length} subject{state.subjects.length === 1 ? '' : 's'}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">This week</div>
          <div className={`stat-value${goalMinutes ? ` tone-${weekMinutes >= goalMinutes ? 'good' : 'bad'}` : ''}`}>{formatMinutes(weekMinutes)}</div>
          <div className="stat-sub">{goalMinutes ? `goal: ${formatMinutes(goalMinutes)}` : 'set a weekly goal in Settings'}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">On track</div>
          <div className="stat-value">
            {onTrackCount}/{state.subjects.length}
          </div>
          <div className="stat-sub">subjects keeping pace with their target date</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Sessions logged</div>
          <div className="stat-value">{state.chapterLogs.length}</div>
          <div className="stat-sub">total chapter-log entries</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">📗 Subject progress</div>
          {subjectRows.length === 0 && <EmptyState emoji="📗" title="No subjects yet" subtitle="Add one to start tracking chapters." />}
          {subjectRows.map(({ subject, stats }) => (
            <div key={subject.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                <span>
                  <span
                    style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: subjectColorVar(state.subjects, subject.id), marginRight: 6 }}
                  />
                  {subject.name}
                </span>
                <span className="muted">
                  {stats.done}/{stats.total}
                </span>
              </div>
              <ProgressBar value={stats.progressPct} tone={stats.daysLeft === null ? undefined : stats.onTrack ? 'good' : 'bad'} />
            </div>
          ))}
          <button className="btn ghost small" style={{ marginTop: 4 }} onClick={() => onNavigate('subjects')}>
            Open subjects →
          </button>
        </div>

        <div className="card">
          <div className="section-title">📅 Coming up</div>
          {upcomingEvents.length === 0 && <EmptyState emoji="📅" title="Nothing on the calendar" />}
          {upcomingEvents.map((ev) => {
            const meta = eventTypeMeta(ev.type)
            return (
              <div className="list-row" key={ev.id}>
                <div className="grow">
                  <h4>{ev.title}</h4>
                  <span className="muted">
                    {formatDate(ev.date)}
                    {ev.time ? ` · ${ev.time}` : ''}
                  </span>
                </div>
                <span className={`badge tone-${ev.type}`}>
                  {meta.emoji} {meta.label}
                </span>
              </div>
            )
          })}
          <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => onNavigate('calendar')}>
            Open calendar →
          </button>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="section-title">📝 Chapter log</div>
          <p className="muted">Log what you studied, how long it took, and how confident you feel — builds your progress report automatically.</p>
          <button className="btn small" onClick={() => onNavigate('studylog')}>
            Open chapter log →
          </button>
        </div>
        <div className="card">
          <div className="section-title">🧠 Study methods</div>
          <p className="muted">See which study method is actually maximizing what you retain, based on your own logged sessions.</p>
          <button className="btn small" onClick={() => onNavigate('methods')}>
            Open study methods →
          </button>
        </div>
      </div>
    </div>
  )
}
