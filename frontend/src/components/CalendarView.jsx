import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import {
  calendarCells,
  currentMonthKey,
  addMonths,
  formatMonthLabel,
  todayKey,
  formatDate,
  eventTypeMeta,
  EVENT_TYPES,
  examTargetDate,
  subjectName,
} from '../lib/utils.js'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function emptyForm(date) {
  return { title: '', date, time: '', type: 'study', notify: true, notes: '' }
}

export default function CalendarView() {
  const { state, dispatch } = useStore()
  const [viewMonth, setViewMonth] = useState(currentMonthKey())
  const [dayModal, setDayModal] = useState(null) // date string
  const [form, setForm] = useState(null) // event being added/edited, or null

  const cells = useMemo(() => calendarCells(viewMonth), [viewMonth])

  // Confirmed exam dates are automatically shown on the calendar too, as
  // read-only chips, so you don't have to enter them twice.
  const examEventsByDate = useMemo(() => {
    const map = {}
    for (const exam of state.exams) {
      const target = examTargetDate(exam)
      if (!target) continue
      if (!map[target]) map[target] = []
      map[target].push({
        id: `exam-${exam.id}`,
        title: exam.title,
        subjectId: exam.subjectId,
        approx: !exam.date,
      })
    }
    return map
  }, [state.exams])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of state.events) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    for (const key in map) map[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    return map
  }, [state.events])

  const upcoming = useMemo(() => {
    const today = todayKey()
    return state.events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 8)
  }, [state.events])

  function openDay(date) {
    setDayModal(date)
    setForm(null)
  }

  function saveEvent(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (form.id) dispatch({ type: 'UPDATE_EVENT', payload: form })
    else dispatch({ type: 'ADD_EVENT', payload: form })
    setForm(null)
  }

  function deleteEvent(id) {
    dispatch({ type: 'DELETE_EVENT', payload: { id } })
  }

  return (
    <div className="grid cols-2" style={{ gridTemplateColumns: '2.1fr 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="calendar-head">
          <button className="btn ghost small" onClick={() => setViewMonth((m) => addMonths(m, -1))}>
            ← Prev
          </button>
          <div className="month-label">{formatMonthLabel(viewMonth)}</div>
          <button className="btn ghost small" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
            Next →
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <button className="btn secondary small" onClick={() => setViewMonth(currentMonthKey())}>
            Today
          </button>
          <button className="btn small" onClick={() => openDay(todayKey())}>
            + Add event
          </button>
        </div>
        <div className="calendar-grid">
          {DOW.map((d) => (
            <div className="calendar-dow" key={d}>
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div className="calendar-cell empty" key={i} />
            const dayEvents = eventsByDate[date] || []
            const examChips = examEventsByDate[date] || []
            const isToday = date === todayKey()
            const allChips = [...examChips.map((x) => ({ ...x, isExam: true })), ...dayEvents]
            return (
              <div className={`calendar-cell${isToday ? ' today' : ''}`} key={date} onClick={() => openDay(date)}>
                <span className="day-num">{Number(date.slice(-2))}</span>
                {allChips.slice(0, 2).map((ev) => {
                  const meta = ev.isExam ? eventTypeMeta('exam') : eventTypeMeta(ev.type)
                  return (
                    <span className="event-chip" key={ev.id} style={{ background: meta.color }}>
                      {ev.isExam ? '🎯 ' : ''}
                      {ev.title}
                      {ev.approx ? ' (~)' : ''}
                    </span>
                  )
                })}
                {allChips.length > 2 && <span className="event-more">+{allChips.length - 2} more</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="section-title">📌 Coming up</div>
        {upcoming.length === 0 && <EmptyState emoji="📅" title="Nothing on the calendar yet" subtitle="Add study sessions, deadlines, or anything else — confirmed exam dates show up here automatically." />}
        {upcoming.map((ev) => {
          const meta = eventTypeMeta(ev.type)
          return (
            <div className="list-row" key={ev.id} onClick={() => openDay(ev.date)} style={{ cursor: 'pointer' }}>
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
      </div>

      {dayModal && (
        <Modal title={formatDate(dayModal)} onClose={() => setDayModal(null)}>
          {(examEventsByDate[dayModal] || []).map((ex) => (
            <div className="list-row" key={ex.id}>
              <div className="grow">
                <h4>🎯 {ex.title}</h4>
                <span className="muted">
                  {ex.subjectId ? subjectName(state.subjects, ex.subjectId) : 'Exam'}
                  {ex.approx ? ' · estimated date' : ''} · edit in the Exams tab
                </span>
              </div>
            </div>
          ))}

          {(eventsByDate[dayModal] || []).map((ev) => {
            const meta = eventTypeMeta(ev.type)
            return (
              <div className="list-row" key={ev.id}>
                <div className="grow">
                  <h4>{ev.title}</h4>
                  <span className="muted">
                    {ev.time || 'All day'} ·{' '}
                    <span className={`badge tone-${ev.type}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    {ev.notify ? ' · 🔔 reminder on' : ''}
                  </span>
                  {ev.notes && <p className="muted" style={{ marginTop: 4 }}>{ev.notes}</p>}
                </div>
                <button className="icon-btn" onClick={() => setForm(ev)} aria-label="Edit">
                  ✏️
                </button>
                <button className="icon-btn" onClick={() => deleteEvent(ev.id)} aria-label="Delete">
                  🗑️
                </button>
              </div>
            )
          })}

          {!form && (
            <button className="btn small" onClick={() => setForm(emptyForm(dayModal))}>
              + Add event for this day
            </button>
          )}

          {form && (
            <form onSubmit={saveEvent} style={{ marginTop: 14, borderTop: '2px dashed var(--panel-deep)', paddingTop: 14 }}>
              <div className="field">
                <label>Title</label>
                <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Revise Chapter 6" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Time (optional)</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="checkbox-row">
                <input type="checkbox" id="notify" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
                <label htmlFor="notify">Pop up a reminder on this day</label>
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" type="submit">
                  {form.id ? 'Save changes' : 'Add event'}
                </button>
                <button className="btn ghost" type="button" onClick={() => setForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
