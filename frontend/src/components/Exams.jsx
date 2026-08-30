import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import { examTargetDate, daysUntil, formatDate, subjectName, MONTH_NAMES } from '../lib/utils.js'

function emptyForm(subjects) {
  return { subjectId: subjects[0]?.id || '', title: '', date: '', tentativeMonth: '', notes: '' }
}

function CountdownChip({ exam }) {
  const target = examTargetDate(exam)
  if (!target) return <span className="badge">No date set</span>
  const days = daysUntil(target)
  const approx = !exam.date && exam.tentativeMonth
  if (days < 0) return <span className="badge tone-bad">Passed</span>
  if (days === 0) return <span className="badge tone-bad">Today!</span>
  return (
    <span className={`badge ${days <= 7 ? 'tone-bad' : days <= 21 ? 'tone-warn' : 'tone-good'}`}>
      {approx ? '~' : ''}
      {days} day{days === 1 ? '' : 's'} to go
    </span>
  )
}

export default function Exams() {
  const { state, dispatch } = useStore()
  const [form, setForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = useMemo(() => {
    return [...state.exams].sort((a, b) => {
      const da = examTargetDate(a)
      const db = examTargetDate(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return da.localeCompare(db)
    })
  }, [state.exams])

  const nearest = sorted.find((e) => examTargetDate(e) && daysUntil(examTargetDate(e)) >= 0)

  function openAdd() {
    setForm(emptyForm(state.subjects))
  }

  function openEdit(exam) {
    setForm({ ...exam })
  }

  function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (!form.date && !form.tentativeMonth) return
    const payload = { ...form, subjectId: form.subjectId || null, date: form.date || null, tentativeMonth: form.date ? null : form.tentativeMonth }
    if (form.id) dispatch({ type: 'UPDATE_EXAM', payload })
    else dispatch({ type: 'ADD_EXAM', payload })
    setForm(null)
  }

  function deleteExam(id) {
    dispatch({ type: 'DELETE_EXAM', payload: { id } })
    setConfirmDelete(null)
  }

  return (
    <div>
      {nearest ? (
        <div className={`countdown-hero${!nearest.date ? ' tentative' : ''}`}>
          <div className="countdown-number">{daysUntil(examTargetDate(nearest))}</div>
          <div className="countdown-body">
            <div className="countdown-title">
              days until {nearest.title}
              {nearest.subjectId ? ` (${subjectName(state.subjects, nearest.subjectId)})` : ''}
            </div>
            <div className="countdown-sub">
              {nearest.date ? `Confirmed for ${formatDate(nearest.date)}` : `Estimated — you said around ${nearest.tentativeMonth}. Update it once you get the real date.`}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState emoji="🎯" title="No exams tracked yet" subtitle="Even if you don't know the exact date, add it with just the month (e.g. October) and get a rough countdown." />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
        <button className="btn" onClick={openAdd}>
          + Add exam
        </button>
      </div>

      {sorted.map((exam) => (
        <div className="list-row" key={exam.id}>
          <div className="grow">
            <h4>{exam.title}</h4>
            <span className="muted">
              {exam.subjectId ? subjectName(state.subjects, exam.subjectId) : 'General'} ·{' '}
              {exam.date ? formatDate(exam.date) : exam.tentativeMonth ? `Sometime in ${exam.tentativeMonth} (estimated)` : 'No date yet'}
            </span>
            {exam.notes && <p className="muted" style={{ marginTop: 4 }}>{exam.notes}</p>}
          </div>
          <CountdownChip exam={exam} />
          <button className="icon-btn" onClick={() => openEdit(exam)} aria-label="Edit">
            ✏️
          </button>
          <button className="icon-btn" onClick={() => setConfirmDelete(exam)} aria-label="Delete">
            🗑️
          </button>
        </div>
      ))}

      {form && (
        <Modal title={form.id ? 'Edit exam' : 'Add exam'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="field">
              <label>Exam title</label>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Biology Paper 1" />
            </div>
            <div className="field">
              <label>Subject (optional)</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">General / not linked</option>
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Confirmed date (leave blank if you don't know it yet)</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, tentativeMonth: e.target.value ? '' : form.tentativeMonth })} />
            </div>
            {!form.date && (
              <div className="field">
                <label>Or just the month you expect it (e.g. October, November)</label>
                <select value={form.tentativeMonth} onChange={(e) => setForm({ ...form, tentativeMonth: e.target.value })}>
                  <option value="">Not sure yet</option>
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <p className="muted" style={{ marginTop: 6 }}>
                  You'll get a rough countdown to the 1st of that month — swap in the real date the moment you have it.
                </p>
              </div>
            )}
            <div className="field">
              <label>Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">
                {form.id ? 'Save changes' : 'Add exam'}
              </button>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.title}"?`} onClose={() => setConfirmDelete(null)}>
          <p className="muted">This can't be undone.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn danger" onClick={() => deleteExam(confirmDelete.id)}>
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
