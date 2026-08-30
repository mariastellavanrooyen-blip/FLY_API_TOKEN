import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import { subjectStats } from '../lib/studyMath.js'
import { subjectColorVar, formatDate, formatMinutes, todayKey } from '../lib/utils.js'

function emptyForm() {
  return { name: '', totalChapters: 10, startDate: todayKey(), targetDate: '' }
}

export default function Subjects({ onNavigate }) {
  const { state, dispatch } = useStore()
  const [form, setForm] = useState(null) // null | {} being added/edited
  const [confirmDelete, setConfirmDelete] = useState(null)

  function openAdd() {
    setForm(emptyForm())
  }

  function openEdit(subject) {
    setForm({ ...subject })
  }

  function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { ...form, totalChapters: Number(form.totalChapters) || 0, targetDate: form.targetDate || null }
    if (form.id) dispatch({ type: 'UPDATE_SUBJECT', payload })
    else dispatch({ type: 'ADD_SUBJECT', payload: { ...payload, createdAt: todayKey() } })
    setForm(null)
  }

  function deleteSubject(id) {
    dispatch({ type: 'DELETE_SUBJECT', payload: { id } })
    setConfirmDelete(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0 }}>
          One card per subject — set how many chapters it has and the window you want to finish it in, then log sessions
          against it from the Chapter Log.
        </p>
        <button className="btn" onClick={openAdd}>
          + Add subject
        </button>
      </div>

      {state.subjects.length === 0 && (
        <EmptyState emoji="📗" title="No subjects yet" subtitle="Add your first subject to start tracking chapters, time and progress." />
      )}

      <div className="grid cols-2">
        {state.subjects.map((subject) => {
          const stats = subjectStats(subject, state.chapterLogs)
          const color = subjectColorVar(state.subjects, subject.id)
          const tone = stats.daysLeft === null ? undefined : stats.onTrack ? 'good' : 'bad'
          return (
            <div className="card" key={subject.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div className="section-title" style={{ marginBottom: 4 }}>
                  <span className="dot" style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  {subject.name}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn" onClick={() => openEdit(subject)} aria-label="Edit">
                    ✏️
                  </button>
                  <button className="icon-btn" onClick={() => setConfirmDelete(subject)} aria-label="Delete">
                    🗑️
                  </button>
                </div>
              </div>

              <ProgressBar value={stats.progressPct} tone={tone} />
              <p className="muted" style={{ marginTop: 6 }}>
                {stats.done} / {stats.total} chapters done ({stats.progressPct}%) · {formatMinutes(stats.totalMinutes)} logged over {stats.sessions} session
                {stats.sessions === 1 ? '' : 's'}
              </p>

              {subject.targetDate ? (
                <p className="muted">
                  Target: <strong>{formatDate(subject.targetDate)}</strong>
                  {stats.daysLeft !== null && (
                    <>
                      {' '}
                      ·{' '}
                      {stats.daysLeft >= 0 ? (
                        <span className={`badge tone-${stats.onTrack ? 'good' : 'bad'}`}>
                          {stats.daysLeft} day{stats.daysLeft === 1 ? '' : 's'} left · {stats.onTrack ? 'on track' : 'behind pace'}
                        </span>
                      ) : (
                        <span className="badge tone-bad">{Math.abs(stats.daysLeft)} days overdue</span>
                      )}
                    </>
                  )}
                </p>
              ) : (
                <p className="muted">No target finish date set — add one so pace can be tracked.</p>
              )}

              <button className="btn secondary small" onClick={() => onNavigate?.('studylog')}>
                📝 Log a chapter →
              </button>
            </div>
          )
        })}
      </div>

      {form && (
        <Modal title={form.id ? 'Edit subject' : 'Add subject'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="field">
              <label>Subject name</label>
              <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Biology" />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Total chapters</label>
                <input type="number" min="1" value={form.totalChapters} onChange={(e) => setForm({ ...form, totalChapters: e.target.value })} />
              </div>
              <div className="field">
                <label>Start date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Target finish date (optional)</label>
              <input type="date" value={form.targetDate || ''} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">
                {form.id ? 'Save changes' : 'Add subject'}
              </button>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.name}"?`} onClose={() => setConfirmDelete(null)}>
          <p className="muted">This also deletes every chapter-log entry and exam linked to this subject. This can't be undone.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn danger" onClick={() => deleteSubject(confirmDelete.id)}>
              Delete subject
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
