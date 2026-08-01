import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { lastNDays, todayKey } from '../lib/utils.js'
import EmptyState from './ui/EmptyState.jsx'

function computeStreak(log) {
  let streak = 0
  let cursor = new Date()
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (log[key]) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function Habits() {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState('')
  const days = lastNDays(35)
  const today = todayKey()

  function addHabit() {
    if (!draft.trim()) return
    dispatch({ type: 'ADD_HABIT', payload: { name: draft.trim() } })
    setDraft('')
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="New habit, e.g. Review flashcards" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHabit()} />
          <button className="btn" onClick={addHabit}>
            + Add habit
          </button>
        </div>
      </div>

      {state.habits.length === 0 ? (
        <div className="card">
          <EmptyState emoji="🔥" title="No habits tracked yet" subtitle="Add one above to start a streak." />
        </div>
      ) : (
        state.habits.map((h) => {
          const streak = computeStreak(h.log)
          const doneToday = !!h.log[today]
          return (
            <div className="card" key={h.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto', transform: 'scale(1.3)' }}
                    checked={doneToday}
                    onChange={() => dispatch({ type: 'TOGGLE_HABIT_DAY', payload: { habitId: h.id, day: today } })}
                  />
                  <div>
                    <strong>{h.name}</strong>
                    <div className="muted">
                      {streak > 0 ? `🔥 ${streak}-day streak` : 'No current streak — check in today!'}
                    </div>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_HABIT', payload: { id: h.id } })}>
                  🗑️
                </button>
              </div>
              <div className="heatmap">
                {days.map((d) => (
                  <div
                    key={d}
                    className={`cell${h.log[d] ? ' done' : ''}`}
                    title={d}
                    style={{ cursor: 'pointer' }}
                    onClick={() => dispatch({ type: 'TOGGLE_HABIT_DAY', payload: { habitId: h.id, day: d } })}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
