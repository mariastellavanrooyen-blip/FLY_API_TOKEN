import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import { formatDate } from '../lib/utils.js'

const emptyForm = { title: '', moduleId: '', targetDate: '' }

export default function Goals() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [milestoneDrafts, setMilestoneDrafts] = useState({})

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name
  }

  function openNew() {
    setForm({ ...emptyForm, moduleId: state.modules[0]?.id || '' })
    setEditing('new')
  }
  function save() {
    if (!form.title.trim()) return
    if (editing === 'new') dispatch({ type: 'ADD_GOAL', payload: form })
    else dispatch({ type: 'UPDATE_GOAL', payload: form })
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
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Set specific, checkable goals</strong>
          <div className="muted">e.g. "Finish Chapter 4 notes by Friday" beats "study more".</div>
        </div>
        <button className="btn" onClick={openNew}>
          + New goal
        </button>
      </div>

      {state.goals.length === 0 ? (
        <div className="card">
          <EmptyState emoji="🎯" title="No goals yet" subtitle="Add a goal and break it into milestones." />
        </div>
      ) : (
        <div className="grid cols-2">
          {state.goals.map((g) => {
            const total = g.milestones.length
            const done = g.milestones.filter((m) => m.done).length
            const pct = total ? Math.round((done / total) * 100) : 0
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
                <ProgressBar value={pct} />
                <div className="muted" style={{ margin: '6px 0 12px' }}>
                  {done}/{total} milestones · {pct}%
                </div>
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
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish Chapter 4 notes" />
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
