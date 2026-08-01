import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { todayKey } from '../lib/utils.js'

const PRESETS = { work: 25, short: 5, long: 15 }

export default function Timer() {
  const { state, dispatch } = useStore()
  const [moduleId, setModuleId] = useState(state.modules[0]?.id || '')
  const [mode, setMode] = useState('work')
  const [minutes, setMinutes] = useState(PRESETS.work)
  const [secondsLeft, setSecondsLeft] = useState(PRESETS.work * 60)
  const [running, setRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function handleComplete() {
    clearInterval(intervalRef.current)
    setRunning(false)
    if (mode === 'work') {
      dispatch({ type: 'LOG_TIMER_SESSION', payload: { date: todayKey(), minutes, moduleId } })
      setSessionsCompleted((c) => c + 1)
    }
    if (typeof Audio !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        osc.frequency.value = 660
        osc.connect(ctx.destination)
        osc.start()
        setTimeout(() => {
          osc.stop()
          ctx.close()
        }, 250)
      } catch {
        // audio unavailable — silently skip the chime
      }
    }
  }

  function selectMode(next) {
    setMode(next)
    setRunning(false)
    const mins = PRESETS[next]
    setMinutes(mins)
    setSecondsLeft(mins * 60)
  }

  function reset() {
    setRunning(false)
    setSecondsLeft(minutes * 60)
  }

  const totalSeconds = minutes * 60
  const pct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const todayMinutes = state.timerSessions.filter((s) => s.date === todayKey()).reduce((sum, s) => sum + s.minutes, 0)

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="pill-select" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button className={mode === 'work' ? 'active' : ''} onClick={() => selectMode('work')}>
            🐇 Focus (25m)
          </button>
          <button className={mode === 'short' ? 'active' : ''} onClick={() => selectMode('short')}>
            🌈 Short break (5m)
          </button>
          <button className={mode === 'long' ? 'active' : ''} onClick={() => selectMode('long')}>
            🥕 Long break (15m)
          </button>
        </div>
        <div className="timer-ring" style={{ '--pct': pct }}>
          <div className="timer-readout">
            <div className="time">
              {mm}:{ss}
            </div>
            <div className="muted">{mode === 'work' ? 'Deep focus' : 'Rest up'}</div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ Pause' : '▶️ Start'}
          </button>
          <button className="btn secondary" onClick={reset}>
            ↺ Reset
          </button>
        </div>
        {mode === 'work' && (
          <div className="field" style={{ maxWidth: 260, margin: '20px auto 0' }}>
            <label>Studying for</label>
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
              {state.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">📊 Today</div>
        <p>
          <strong>{todayMinutes} minutes</strong> logged today · <strong>{sessionsCompleted}</strong> focus sessions completed this visit
        </p>
        <div className="section-title" style={{ marginTop: 18 }}>
          🕰️ Recent sessions
        </div>
        {state.timerSessions.length === 0 && <p className="muted">No sessions logged yet — start your first focus block!</p>}
        {[...state.timerSessions]
          .slice(-8)
          .reverse()
          .map((s, i) => (
            <div className="list-row" key={i}>
              <span className="grow">{state.modules.find((m) => m.id === s.moduleId)?.name || 'General'}</span>
              <span className="muted">{s.date}</span>
              <span className="badge">{s.minutes}m</span>
            </div>
          ))}
      </div>
    </div>
  )
}
