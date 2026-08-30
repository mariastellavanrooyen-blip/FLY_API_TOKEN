import React, { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { notificationPermission, notificationsSupported, requestNotificationPermission } from '../lib/notify.js'

export default function Settings() {
  const { state, dispatch } = useStore()
  const [permission, setPermission] = useState(notificationPermission())
  const fileRef = useRef(null)

  function setSetting(patch) {
    dispatch({ type: 'SET_SETTINGS', payload: patch })
  }

  async function enableNotifications() {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `examready-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        dispatch({ type: 'IMPORT_STATE', payload: parsed })
      } catch {
        alert('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="section-title">🐇 You</div>
        <div className="field">
          <label>App name</label>
          <input value={state.settings.appName} onChange={(e) => setSetting({ appName: e.target.value })} />
        </div>
        <div className="field">
          <label>Your name</label>
          <input value={state.settings.studentName} onChange={(e) => setSetting({ studentName: e.target.value })} />
        </div>
        <div className="field">
          <label>Weekly study goal (hours)</label>
          <input
            type="number"
            min="0"
            style={{ maxWidth: 120 }}
            value={state.settings.weeklyGoalHours}
            onChange={(e) => setSetting({ weeklyGoalHours: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-title">🔔 Reminders</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Whenever you open the app on a day with a calendar event, or an exam hits one of your reminder points, you'll always see
          an in-app banner. Turning on browser notifications adds a real pop-up too — handy if you keep the app open in a
          background tab.
        </p>
        {!notificationsSupported() ? (
          <p className="muted">This browser doesn't support notifications — the in-app banner will still work.</p>
        ) : permission === 'granted' ? (
          <span className="badge tone-good">Notifications on ✅</span>
        ) : permission === 'denied' ? (
          <span className="badge tone-bad">Blocked — enable it in your browser's site settings</span>
        ) : (
          <button className="btn secondary small" onClick={enableNotifications}>
            Enable notifications
          </button>
        )}
        <p className="muted" style={{ marginTop: 12 }}>
          Exam countdown nudges fire at: {state.settings.examReminderDays.slice().sort((a, b) => b - a).join(', ')} day(s) before
          (and on the day itself).
        </p>
      </div>

      <div className="card">
        <div className="section-title">💾 Your data</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Everything — subjects, chapter log, exams, calendar — is stored only on this device, offline. Export a backup to move it
          to another device, or after switching browsers.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={exportData}>
            ⬇️ Export backup
          </button>
          <button className="btn secondary" onClick={() => fileRef.current?.click()}>
            ⬆️ Import backup
          </button>
          <input type="file" accept="application/json" ref={fileRef} style={{ display: 'none' }} onChange={importData} />
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('This clears everything — subjects, chapter log, exams and calendar. Export a backup first?')) {
                dispatch({ type: 'RESET_STATE' })
              }
            }}
          >
            🗑️ Reset all data
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">🌸 About</div>
        <p className="muted">
          {state.settings.appName} is your exam prep command centre — subjects with chapter-by-chapter progress, a study session
          log, an adjustable calendar with reminders, exam countdowns (even before you know the exact date), and insight into
          which study method is actually working for you. Install it from your browser's menu to use it like a real app, offline.
        </p>
      </div>
    </div>
  )
}
