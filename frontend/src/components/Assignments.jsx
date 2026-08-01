import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import { daysUntil, formatDate } from '../lib/utils.js'

function dueBadge(dueDate, status) {
  if (status === 'done') return <span className="badge status-done">✅ Done</span>
  const d = daysUntil(dueDate)
  if (d === null) return null
  if (d < 0) return <span className="badge status-overdue">⏰ Overdue</span>
  if (d === 0) return <span className="badge priority-high">Due today</span>
  if (d <= 3) return <span className="badge priority-medium">Due in {d}d</span>
  return <span className="badge">Due in {d}d</span>
}

const emptyForm = { title: '', description: '', moduleId: '', dueDate: '', priority: 'medium' }

export default function Assignments() {
  const { state, dispatch } = useStore()
  const [filterModule, setFilterModule] = useState('all')
  const [showDone, setShowDone] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | assignment object
  const [form, setForm] = useState(emptyForm)

  const list = useMemo(() => {
    let items = state.assignments
    if (filterModule !== 'all') items = items.filter((a) => a.moduleId === filterModule)
    if (!showDone) items = items.filter((a) => a.status !== 'done')
    return [...items].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
  }, [state.assignments, filterModule, showDone])

  function openNew() {
    setForm({ ...emptyForm, moduleId: state.modules[0]?.id || '' })
    setEditing('new')
  }
  function openEdit(a) {
    setForm(a)
    setEditing(a.id)
  }
  function save() {
    if (!form.title.trim()) return
    if (editing === 'new') dispatch({ type: 'ADD_ASSIGNMENT', payload: form })
    else dispatch({ type: 'UPDATE_ASSIGNMENT', payload: form })
    setEditing(null)
  }
  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name || '—'
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="pill-select">
            <button className={filterModule === 'all' ? 'active' : ''} onClick={() => setFilterModule('all')}>
              All modules
            </button>
            {state.modules.map((m) => (
              <button key={m.id} className={filterModule === m.id ? 'active' : ''} onClick={() => setFilterModule(m.id)}>
                {m.name}
              </button>
            ))}
            <button className={showDone ? 'active' : ''} onClick={() => setShowDone((s) => !s)}>
              {showDone ? '👁️ Showing done' : '🙈 Hiding done'}
            </button>
          </div>
          <button className="btn" onClick={openNew}>
            + New assignment
          </button>
        </div>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <EmptyState emoji="🥕" title="No assignments here yet" subtitle="Add one to start tracking due dates." />
        ) : (
          list.map((a) => (
            <div className="list-row" key={a.id}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={a.status === 'done'}
                onChange={() =>
                  dispatch({ type: 'UPDATE_ASSIGNMENT', payload: { id: a.id, status: a.status === 'done' ? 'todo' : 'done' } })
                }
              />
              <div className="grow" onClick={() => openEdit(a)} style={{ cursor: 'pointer' }}>
                <h4 style={{ textDecoration: a.status === 'done' ? 'line-through' : 'none' }}>{a.title}</h4>
                <div className="muted">
                  {moduleName(a.moduleId)} {a.dueDate ? `· due ${formatDate(a.dueDate)}` : ''}
                </div>
              </div>
              <span className={`badge priority-${a.priority}`}>{a.priority}</span>
              {dueBadge(a.dueDate, a.status)}
              <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_ASSIGNMENT', payload: { id: a.id } })}>
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New assignment' : 'Edit assignment'} onClose={() => setEditing(null)}>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Case brief — Smith v. Jones" />
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
              <label>Due date</label>
              <input type="date" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Priority</label>
            <div className="pill-select">
              {['low', 'medium', 'high'].map((p) => (
                <button key={p} className={form.priority === p ? 'active' : ''} onClick={() => setForm({ ...form, priority: p })}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            {editing !== 'new' && (
              <button
                className="btn danger"
                onClick={() => {
                  dispatch({ type: 'DELETE_ASSIGNMENT', payload: { id: form.id } })
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
