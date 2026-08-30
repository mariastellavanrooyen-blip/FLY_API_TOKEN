import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import Stars from './ui/Stars.jsx'
import { subjectColorVar, subjectName, formatDate, formatMinutes, todayKey } from '../lib/utils.js'

function emptyForm(subjects) {
  return {
    subjectId: subjects[0]?.id || '',
    chapter: '',
    date: todayKey(),
    minutes: 45,
    method: '',
    confidence: 3,
    completed: false,
    notes: '',
  }
}

export default function StudyLog() {
  const { state, dispatch } = useStore()
  const [filterSubject, setFilterSubject] = useState('all')
  const [form, setForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const logs = useMemo(() => {
    const rows = filterSubject === 'all' ? state.chapterLogs : state.chapterLogs.filter((l) => l.subjectId === filterSubject)
    return [...rows].sort((a, b) => b.date.localeCompare(a.date))
  }, [state.chapterLogs, filterSubject])

  const totals = useMemo(() => {
    const minutes = logs.reduce((s, l) => s + (Number(l.minutes) || 0), 0)
    return { count: logs.length, minutes }
  }, [logs])

  function openAdd() {
    if (state.subjects.length === 0) return
    setForm(emptyForm(state.subjects))
  }

  function openEdit(log) {
    setForm({ ...log })
  }

  function save(e) {
    e.preventDefault()
    if (!form.subjectId || !form.chapter.trim() || !form.method) return
    const payload = { ...form, minutes: Number(form.minutes) || 0, confidence: Number(form.confidence) || 0 }
    if (form.id) dispatch({ type: 'UPDATE_LOG', payload })
    else dispatch({ type: 'ADD_LOG', payload })
    setForm(null)
  }

  function deleteLog(id) {
    dispatch({ type: 'DELETE_LOG', payload: { id } })
    setConfirmDelete(null)
  }

  if (state.subjects.length === 0) {
    return <EmptyState emoji="📗" title="Add a subject first" subtitle="Head to Subjects to add what you're studying, then come back here to log chapters." />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="pill-select">
          <button className={filterSubject === 'all' ? 'active' : ''} onClick={() => setFilterSubject('all')}>
            All subjects
          </button>
          {state.subjects.map((s) => (
            <button key={s.id} className={filterSubject === s.id ? 'active' : ''} onClick={() => setFilterSubject(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <button className="btn" onClick={openAdd}>
          + Log a chapter
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 12 }}>
        {totals.count} session{totals.count === 1 ? '' : 's'} logged · {formatMinutes(totals.minutes)} total
      </p>

      {logs.length === 0 && <EmptyState emoji="📝" title="No sessions logged yet" subtitle="Log what you studied, how long it took, and which method you used." />}

      {logs.map((log) => {
        const method = state.methods.find((m) => m.id === log.method)
        const color = subjectColorVar(state.subjects, log.subjectId)
        return (
          <div className="list-row" key={log.id}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div className="grow">
              <h4>
                {subjectName(state.subjects, log.subjectId)} — {log.chapter}
              </h4>
              <span className="muted">
                {formatDate(log.date)} · {formatMinutes(log.minutes)} · {method?.name || 'Unknown method'}
              </span>
              {log.notes && <p className="muted" style={{ marginTop: 4 }}>{log.notes}</p>}
            </div>
            <Stars value={log.confidence} />
            {log.completed && <span className="badge tone-good">✅ Chapter done</span>}
            <button className="icon-btn" onClick={() => openEdit(log)} aria-label="Edit">
              ✏️
            </button>
            <button className="icon-btn" onClick={() => setConfirmDelete(log)} aria-label="Delete">
              🗑️
            </button>
          </div>
        )
      })}

      {form && (
        <Modal title={form.id ? 'Edit session' : 'Log a chapter session'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="field-row">
              <div className="field">
                <label>Subject</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Chapter (name or number)</label>
                <input autoFocus value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="e.g. Chapter 4" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="field">
                <label>Time spent (minutes)</label>
                <input type="number" min="1" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Study method used</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="">Choose a method…</option>
                {state.methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Understanding / confidence after this session</label>
              <Stars value={form.confidence} onChange={(v) => setForm({ ...form, confidence: v })} />
            </div>
            <div className="checkbox-row">
              <input type="checkbox" id="completed" checked={form.completed} onChange={(e) => setForm({ ...form, completed: e.target.checked })} />
              <label htmlFor="completed">Mark this chapter as fully done</label>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">
                {form.id ? 'Save changes' : 'Add to log'}
              </button>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete this session?" onClose={() => setConfirmDelete(null)}>
          <p className="muted">This removes it from your chapter log and progress totals.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn danger" onClick={() => deleteLog(confirmDelete.id)}>
              Delete
            </button>
            <button className="btn ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
