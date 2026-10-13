import React, { useMemo } from 'react'
import { useStore } from '../state/store.jsx'
import { TIPS } from '../lib/tipsData.js'
import { daysUntil, formatDate, todayKey, computeModuleAverage } from '../lib/utils.js'
import ProgressBar from './ui/ProgressBar.jsx'
import EmptyState from './ui/EmptyState.jsx'

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

export default function Dashboard({ onNavigate }) {
  const { state, dispatch } = useStore()
  const tipOfDay = TIPS[dayOfYear() % TIPS.length]
  const today = todayKey()

  const upcoming = useMemo(
    () =>
      state.assignments
        .filter((a) => a.status !== 'done')
        .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
        .slice(0, 5),
    [state.assignments],
  )

  const overdueCount = state.assignments.filter((a) => a.status !== 'done' && daysUntil(a.dueDate) < 0).length
  const todayMinutes = state.timerSessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.minutes, 0)
  const activeGoals = state.goals.filter((g) => g.milestones.some((m) => !m.done) || g.milestones.length === 0)
  const recentDocs = [...state.documents].sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || '')).slice(0, 3)
  const reviewedDocs = state.documents.filter((d) => d.status === 'reviewed').length

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name || '—'
  }

  return (
    <div>
      <div className="grid cols-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem' }}>✅</div>
          <div className="muted">Open assignments</div>
          <h2 style={{ margin: 0 }}>{state.assignments.filter((a) => a.status !== 'done').length}</h2>
          {overdueCount > 0 && <span className="badge status-overdue">{overdueCount} overdue</span>}
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem' }}>⏱️</div>
          <div className="muted">Minutes studied today</div>
          <h2 style={{ margin: 0 }}>{todayMinutes}</h2>
          <button className="btn small secondary" onClick={() => onNavigate('timer')}>
            Start a session
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem' }}>🔥</div>
          <div className="muted">Habits checked in today</div>
          <h2 style={{ margin: 0 }}>
            {state.habits.filter((h) => h.log[today]).length}/{state.habits.length}
          </h2>
          <button className="btn small secondary" onClick={() => onNavigate('habits')}>
            View habits
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">📦 My Burrow</div>
        {state.documents.length === 0 ? (
          <EmptyState emoji="📦" title="Nothing stashed yet" subtitle="Upload chapter PDFs, docs or photos and Burrow & Brief will remember them for you." />
        ) : (
          <>
            <p className="muted" style={{ marginTop: -4 }}>
              {state.documents.length} document{state.documents.length > 1 ? 's' : ''} remembered · {reviewedDocs} reviewed
            </p>
            {recentDocs.map((d) => (
              <div className="list-row" key={d.id}>
                <span className="grow">{d.filename}</span>
                <span className="muted">{moduleName(d.moduleId)}</span>
                <span className={`badge${d.status === 'reviewed' ? ' status-done' : ''}`}>{d.status === 'in-progress' ? 'In progress' : d.status === 'reviewed' ? 'Reviewed' : 'New'}</span>
              </div>
            ))}
          </>
        )}
        <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => onNavigate('library')}>
          Open My Burrow →
        </button>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">📅 Upcoming assignments</div>
          {upcoming.length === 0 ? (
            <EmptyState emoji="🥕" title="Nothing due — nice work!" subtitle="Add assignments to track deadlines." />
          ) : (
            upcoming.map((a) => {
              const d = daysUntil(a.dueDate)
              return (
                <div className="list-row" key={a.id}>
                  <div className="grow">
                    <h4>{a.title}</h4>
                    <div className="muted">
                      {moduleName(a.moduleId)} {a.dueDate ? `· due ${formatDate(a.dueDate)}` : '· no due date'}
                    </div>
                  </div>
                  {d !== null && d < 0 && <span className="badge status-overdue">Overdue</span>}
                  {d !== null && d >= 0 && d <= 2 && <span className="badge priority-high">{d === 0 ? 'Today' : `${d}d`}</span>}
                </div>
              )
            })
          )}
          <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => onNavigate('assignments')}>
            View all assignments →
          </button>
        </div>

        <div className="card">
          <div className="section-title">🎯 Goals &amp; Grades</div>
          {activeGoals.length === 0 ? (
            <EmptyState emoji="🎯" title="No active goals" subtitle="Set one to stay focused." />
          ) : (
            activeGoals.slice(0, 4).map((g) => {
              const total = g.milestones.length
              const done = g.milestones.filter((m) => m.done).length
              const milestonePct = total ? Math.round((done / total) * 100) : null
              const currentAvg = g.moduleId ? computeModuleAverage(state.grades, g.moduleId) : null
              const hasGradeTarget = g.targetGradePct != null && g.moduleId
              const gradePct = hasGradeTarget && currentAvg !== null ? Math.min(100, Math.round((currentAvg / g.targetGradePct) * 100)) : null
              const pct = milestonePct ?? gradePct ?? 0
              return (
                <div key={g.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                    <strong>{g.title}</strong>
                    <span className="muted">
                      {hasGradeTarget
                        ? currentAvg !== null
                          ? `${currentAvg.toFixed(1)}% / ${g.targetGradePct}%`
                          : `target ${g.targetGradePct}%`
                        : `${pct}%`}
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              )
            })
          )}
          <button className="btn ghost small" style={{ marginTop: 4 }} onClick={() => onNavigate('goals')}>
            View goals &amp; grades →
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">
          💡 Tip of the day <span className="decor-rainbow-arc" style={{ fontSize: '1.2rem' }}>🌈</span>
        </div>
        <div className="tip-card">
          <span style={{ fontSize: '1.6rem' }}>{tipOfDay.emoji}</span>
          <h4 style={{ margin: '4px 0' }}>{tipOfDay.title}</h4>
          <p style={{ margin: 0 }}>{tipOfDay.body}</p>
        </div>
        <button
          className="btn ghost small"
          style={{ marginTop: 10 }}
          onClick={() => dispatch({ type: 'TOGGLE_TIP_FAVORITE', payload: { tipId: tipOfDay.id } })}
        >
          {state.favoriteTips.includes(tipOfDay.id) ? '⭐ Favorited' : '☆ Save this tip'}
        </button>
      </div>
    </div>
  )
}
