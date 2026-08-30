import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import EmptyState from './ui/EmptyState.jsx'
import IdentityBars from './ui/IdentityBars.jsx'
import { methodStats, bestMethod } from '../lib/studyMath.js'
import { colorVarByIndex, formatMinutes } from '../lib/utils.js'

export default function Methods() {
  const { state, dispatch } = useStore()
  const [newMethod, setNewMethod] = useState('')

  const stats = useMemo(() => methodStats(state.chapterLogs, state.methods), [state.chapterLogs, state.methods])
  const best = useMemo(() => bestMethod(state.chapterLogs, state.methods, 3), [state.chapterLogs, state.methods])

  const rows = stats.map((s) => {
    const idx = state.methods.findIndex((m) => m.id === s.methodId)
    return { id: s.methodId, name: s.name, value: s.avgConfidence, display: `${s.avgConfidence.toFixed(1)}★ avg · ${s.sessions} session${s.sessions === 1 ? '' : 's'}`, color: colorVarByIndex(idx) }
  })

  function addMethod(e) {
    e.preventDefault()
    if (!newMethod.trim()) return
    dispatch({ type: 'ADD_METHOD', payload: { name: newMethod.trim() } })
    setNewMethod('')
  }

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="card">
          <div className="section-title">📊 What's working best for you</div>
          {stats.length === 0 ? (
            <EmptyState emoji="🧠" title="No data yet" subtitle="Log a few chapter sessions with a method and a confidence rating, and your best method will show up here." />
          ) : (
            <>
              {best ? (
                <div className="recommend-banner">
                  <span className="banner-emoji">🏆</span>
                  <div className="grow">
                    <strong>{best.name}</strong> is paying off best so far — {best.avgConfidence.toFixed(1)}★ average confidence over {best.sessions} sessions
                    ({formatMinutes(best.totalMinutes)} invested).
                  </div>
                </div>
              ) : (
                <p className="muted">Log at least 3 sessions with the same method to get a confident recommendation.</p>
              )}
              <IdentityBars rows={rows} max={5} />
              <p className="muted" style={{ marginTop: 8 }}>
                Ranked by average self-rated confidence (1-5★) after each session — the method that's actually leaving you feeling
                like you know the material, not just the one you use most.
              </p>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-title">➕ Add a custom method</div>
          <form onSubmit={addMethod} style={{ display: 'flex', gap: 8 }}>
            <input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="e.g. Past-paper timed drills" />
            <button className="btn secondary small" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="section-title">📚 Method reference</div>
        <p className="muted" style={{ marginTop: -4, marginBottom: 12 }}>
          Not sure what to try? A rough rule of thumb: methods that force you to <em>retrieve</em> information (recall, questions,
          teaching) beat methods where you just re-absorb it (re-reading). Mix a couple and see what your own data says.
        </p>
        {state.methods.map((m) => (
          <div className="method-card" key={m.id}>
            <h4>{m.name}</h4>
            {m.hint && <p className="muted" style={{ margin: 0 }}>{m.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
