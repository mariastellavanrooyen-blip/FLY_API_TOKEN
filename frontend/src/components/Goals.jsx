import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import { formatDate, computeModuleAverage, uid } from '../lib/utils.js'

const emptyGoalForm = { title: '', moduleId: '', targetDate: '', targetGradePct: '' }
const emptyGradeForm = { moduleId: '', title: '', score: '', maxScore: '100', category: 'Assignment', date: '' }
const GRADE_CATEGORIES = ['Assignment', 'Exam', 'Quiz', 'Participation', 'Other']

function gradeBadgeClass(pct) {
  if (pct >= 75) return 'badge status-done'
  if (pct >= 50) return 'badge priority-medium'
  return 'badge priority-high'
}

function GradeTracker() {
  const { state, dispatch } = useStore()
  const [filterModule, setFilterModule] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyGradeForm)

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name || 'General'
  }

  function openNew() {
    setForm({ ...emptyGradeForm, moduleId: state.modules[0]?.id || '' })
    setEditing('new')
  }
  function openEdit(g) {
    setForm({ ...g, score: String(g.score), maxScore: String(g.maxScore) })
    setEditing(g.id)
  }
  function save() {
    const score = parseFloat(form.score)
    const maxScore = parseFloat(form.maxScore)
    if (!form.title.trim() || !form.moduleId || Number.isNaN(score) || Number.isNaN(maxScore) || maxScore <= 0) return
    const payload = { ...form, score, maxScore }
    if (editing === 'new') dispatch({ type: 'ADD_GRADE', payload: { id: uid(), ...payload } })
    else dispatch({ type: 'UPDATE_GRADE', payload })
    setEditing(null)
  }

  const modulesToShow = filterModule === 'all' ? state.modules : state.modules.filter((m) => m.id === filterModule)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          📊 Grade Tracker
        </div>
        <button className="btn" onClick={openNew}>
          + Log a grade
        </button>
      </div>
      <p className="muted" style={{ marginTop: -4 }}>
        Log marks as you get them back — your average per module updates automatically, and any goal with a target
        grade below will show how close you are.
      </p>

      {state.modules.length > 1 && (
        <div className="pill-select" style={{ marginBottom: 4 }}>
          <button className={filterModule === 'all' ? 'active' : ''} onClick={() => setFilterModule('all')}>
            All modules
          </button>
          {state.modules.map((m) => (
            <button key={m.id} className={filterModule === m.id ? 'active' : ''} onClick={() => setFilterModule(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid cols-2">
        {modulesToShow.map((m) => {
          const list = state.grades.filter((g) => g.moduleId === m.id)
          const avg = computeModuleAverage(state.grades, m.id)
          return (
            <div key={m.id} style={{ border: '1px solid var(--beige-deep)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{m.name}</strong>
                {avg !== null ? (
                  <span className={gradeBadgeClass(avg)}>{avg.toFixed(1)}% avg</span>
                ) : (
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    No grades yet
                  </span>
                )}
              </div>
              {list.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                  Log your first grade for this module above.
                </p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {[...list]
                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                    .map((g) => {
                      const pct = (g.score / g.maxScore) * 100
                      return (
                        <div className="list-row" key={g.id} style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => openEdit(g)}>
                          <div className="grow">
                            <h4 style={{ margin: 0, fontSize: '0.88rem' }}>{g.title}</h4>
                            <div className="muted" style={{ fontSize: '0.76rem' }}>
                              {g.category} {g.date ? `· ${formatDate(g.date)}` : ''} · {g.score}/{g.maxScore}
                            </div>
                          </div>
                          <span className={gradeBadgeClass(pct)}>{pct.toFixed(0)}%</span>
                          <button
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              dispatch({ type: 'DELETE_GRADE', payload: { id: g.id } })
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Log a grade' : 'Edit grade'} onClose={() => setEditing(null)}>
          <div className="field">
            <label>What was it?</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midterm exam" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Module</label>
              <select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
                {state.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {GRADE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Score</label>
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="e.g. 82" />
            </div>
            <div className="field">
              <label>Out of</label>
              <input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} placeholder="100" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            {editing !== 'new' && (
              <button
                className="btn danger"
                onClick={() => {
                  dispatch({ type: 'DELETE_GRADE', payload: { id: form.id } })
                  setEditing(null)
                }}
              >
                Delete
              </button>
            )}
            <button className="btn" onClick={save}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function Goals() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyGoalForm)
  const [milestoneDrafts, setMilestoneDrafts] = useState({})

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name
  }

  function openNew() {
    setForm({ ...emptyGoalForm, moduleId: state.modules[0]?.id || '' })
    setEditing('new')
  }
  function save() {
    if (!form.title.trim()) return
    const payload = { ...form, targetGradePct: form.targetGradePct === '' ? null : parseFloat(form.targetGradePct) }
    if (editing === 'new') dispatch({ type: 'ADD_GOAL', payload })
    else dispatch({ type: 'UPDATE_GOAL', payload })
    setEditing(null)
  }

  function addMilestone(goalId) {
    const text = (milestoneDrafts[goalId] || '').trim()
    if (!text) return
    dispatch({ type: 'ADD_MILESTONE', payload: { goalId, text } })
    setMilestoneDrafts({ ...milestoneDrafts, [goalId]: '' })
  }

  return (
    <div>
      <GradeTracker />

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div>
          <strong>🎯 Goals</strong>
          <div className="muted">
            e.g. "Finish Chapter 4 notes by Friday", or set a target grade to track against what you log above.
          </div>
        </div>
        <button className="btn" onClick={openNew}>
          + New goal
        </button>
      </div>

      {state.goals.length === 0 ? (
        <div className="card">
          <EmptyState emoji="🎯" title="No goals yet" subtitle="Add a goal — with milestones, a target grade, or both." />
        </div>
      ) : (
        <div className="grid cols-2">
          {state.goals.map((g) => {
            const total = g.milestones.length
            const done = g.milestones.filter((m) => m.done).length
            const pct = total ? Math.round((done / total) * 100) : 0
            const currentAvg = g.moduleId ? computeModuleAverage(state.grades, g.moduleId) : null
            const hasGradeTarget = g.targetGradePct != null && g.moduleId
            return (
              <div className="card" key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0 }}>{g.title}</h4>
                  <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_GOAL', payload: { id: g.id } })}>
                    🗑️
                  </button>
                </div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  {moduleName(g.moduleId) || 'General'} {g.targetDate ? `· target ${formatDate(g.targetDate)}` : ''}
                </div>

                {hasGradeTarget && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span>
                        Target: <strong>{g.targetGradePct}%</strong>
                      </span>
                      <span>{currentAvg !== null ? `Currently: ${currentAvg.toFixed(1)}%` : 'No grades logged yet'}</span>
                    </div>
                    <ProgressBar value={currentAvg !== null ? Math.min(100, (currentAvg / g.targetGradePct) * 100) : 0} />
                    {currentAvg !== null && (
                      <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
                        {currentAvg >= g.targetGradePct
                          ? `🎉 On track — ${(currentAvg - g.targetGradePct).toFixed(1)} points above target`
                          : `📉 ${(g.targetGradePct - currentAvg).toFixed(1)} points below target`}
                      </p>
                    )}
                  </div>
                )}

                {total > 0 && (
                  <>
                    <ProgressBar value={pct} />
                    <div className="muted" style={{ margin: '6px 0 12px' }}>
                      {done}/{total} milestones · {pct}%
                    </div>
                  </>
                )}
                {g.milestones.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={m.done}
                      onChange={() => dispatch({ type: 'TOGGLE_MILESTONE', payload: { goalId: g.id, milestoneId: m.id } })}
                    />
                    <span style={{ textDecoration: m.done ? 'line-through' : 'none', fontSize: '0.88rem' }}>{m.text}</span>
                  </label>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input
                    placeholder="Add milestone…"
                    value={milestoneDrafts[g.id] || ''}
                    onChange={(e) => setMilestoneDrafts({ ...milestoneDrafts, [g.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addMilestone(g.id)}
                  />
                  <button className="btn small secondary" onClick={() => addMilestone(g.id)}>
                    Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New goal' : 'Edit goal'} onClose={() => setEditing(null)}>
          <div className="field">
            <label>Goal</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish Chapter 4 notes, or Get 75% average" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Module</label>
              <select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
                <option value="">General</option>
                {state.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target date</label>
              <input type="date" value={form.targetDate || ''} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
          </div>
          {form.moduleId && (
            <div className="field">
              <label>Target grade % (optional)</label>
              <input
                type="number"
                value={form.targetGradePct}
                onChange={(e) => setForm({ ...form, targetGradePct: e.target.value })}
                placeholder="e.g. 75 — compares against grades you log above"
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={save}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
