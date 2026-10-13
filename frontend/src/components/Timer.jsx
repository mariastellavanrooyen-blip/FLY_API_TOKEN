import React, { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { todayKey } from '../lib/utils.js'

const PRESETS = { work: 25, short: 5, long: 15 }
const MODE_LABEL = { work: 'Deep focus', short: 'Rest up', long: 'Rest up' }

function computeSecondsLeft(timer) {
  if (timer.running && timer.endTime) {
    return Math.max(0, Math.round((timer.endTime - Date.now()) / 1000))
  }
  return timer.pausedRemainingSeconds ?? timer.minutes * 60
}

function notificationSupport() {
  return typeof Notification !== 'undefined'
}

export default function Timer() {
  const { state, dispatch } = useStore()
  const timer = state.timer
  const [, forceTick] = useState(0)
  const [notifPermission, setNotifPermission] = useState(notificationSupport() ? Notification.permission : 'unsupported')

  // Re-render once a second while running so the displayed countdown moves —
  // the actual source of truth is timer.endTime (a timestamp), not this tick.
  useEffect(() => {
    if (!timer.running) return undefined
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [timer.running])

  function updateTimer(patch) {
    dispatch({ type: 'UPDATE_TIMER', payload: patch })
  }

  async function ensureNotificationPermission() {
    if (!notificationSupport()) return
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setNotifPermission(result)
    }
  }

  function toggleRunning() {
    if (timer.running) {
      const remaining = computeSecondsLeft(timer)
      updateTimer({ running: false, endTime: null, pausedRemainingSeconds: remaining })
    } else {
      ensureNotificationPermission()
      const remaining = timer.pausedRemainingSeconds ?? timer.minutes * 60
      updateTimer({ running: true, endTime: Date.now() + remaining * 1000, pausedRemainingSeconds: null })
    }
  }

  function selectMode(next) {
    updateTimer({ mode: next, minutes: PRESETS[next], running: false, endTime: null, pausedRemainingSeconds: null })
  }

  function reset() {
    updateTimer({ running: false, endTime: null, pausedRemainingSeconds: null })
  }

  const secondsLeft = computeSecondsLeft(timer)
  const totalSeconds = timer.minutes * 60
  const pct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const todayMinutes = state.timerSessions.filter((s) => s.date === todayKey()).reduce((sum, s) => sum + s.minutes, 0)
  const sessionsToday = state.timerSessions.filter((s) => s.date === todayKey()).length

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="pill-select" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button className={timer.mode === 'work' ? 'active' : ''} onClick={() => selectMode('work')}>
            🐇 Focus (25m)
          </button>
          <button className={timer.mode === 'short' ? 'active' : ''} onClick={() => selectMode('short')}>
            🌈 Short break (5m)
          </button>
          <button className={timer.mode === 'long' ? 'active' : ''} onClick={() => selectMode('long')}>
            🥕 Long break (15m)
          </button>
        </div>
        <div className="timer-ring" style={{ '--pct': pct }}>
          <div className="timer-readout">
            <div className="time">
              {mm}:{ss}
            </div>
            <div className="muted">{MODE_LABEL[timer.mode]}</div>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" onClick={toggleRunning}>
            {timer.running ? '⏸ Pause' : '▶️ Start'}
          </button>
          <button className="btn secondary" onClick={reset}>
            ↺ Reset
          </button>
        </div>
        {timer.mode === 'work' && (
          <div className="field" style={{ maxWidth: 260, margin: '20px auto 0' }}>
            <label>Studying for</label>
            <select value={timer.moduleId} onChange={(e) => updateTimer({ moduleId: e.target.value })}>
              {state.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <p className="muted" style={{ marginTop: 16, fontSize: '0.78rem' }}>
          🕰️ Keeps running even if you switch to another tab in the app.
        </p>
        {notificationSupport() && notifPermission !== 'granted' && (
          <button className="btn ghost small" style={{ marginTop: 4 }} onClick={ensureNotificationPermission}>
            {notifPermission === 'denied'
              ? '🔕 Notifications blocked — enable in browser settings'
              : '🔔 Get notified when it finishes'}
          </button>
        )}
        {notificationSupport() && notifPermission === 'granted' && (
          <p className="muted" style={{ marginTop: 4, fontSize: '0.78rem' }}>
            🔔 You'll get a notification when this finishes.
          </p>
        )}
      </div>

      <div className="card">
        <div className="section-title">📊 Today</div>
        <p>
          <strong>{todayMinutes} minutes</strong> logged today · <strong>{sessionsToday}</strong> focus session{sessionsToday === 1 ? '' : 's'} today
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
