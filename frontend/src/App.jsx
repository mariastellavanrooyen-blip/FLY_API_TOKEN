import React, { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Subjects from './components/Subjects.jsx'
import StudyLog from './components/StudyLog.jsx'
import CalendarView from './components/CalendarView.jsx'
import Exams from './components/Exams.jsx'
import Methods from './components/Methods.jsx'
import Settings from './components/Settings.jsx'
import Toast from './components/Toast.jsx'
import { useStore } from './state/store.jsx'
import { todayKey, examTargetDate, daysUntil } from './lib/utils.js'
import { fireNotification } from './lib/notify.js'

const TITLES = {
  dashboard: ['🏠', 'Dashboard'],
  subjects: ['📗', 'Subjects'],
  studylog: ['📝', 'Chapter Log'],
  calendar: ['📅', 'Calendar'],
  exams: ['🎯', 'Exams'],
  methods: ['🧠', 'Study Methods'],
  settings: ['⚙️', 'Settings'],
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { state, dispatch } = useStore()
  const [icon, label] = TITLES[tab]
  const notifiedRef = useRef(new Set())
  const [dismissed, setDismissed] = useState(new Set())

  const todayAlerts = useMemo(() => {
    const today = todayKey()
    const alerts = []
    for (const ev of state.events) {
      if (ev.date === today) alerts.push({ id: `ev-${ev.id}`, emoji: '📌', title: ev.title, body: 'On today\'s calendar.' })
    }
    for (const exam of state.exams) {
      const target = examTargetDate(exam)
      if (!target) continue
      const days = daysUntil(target)
      if (state.settings.examReminderDays.includes(days)) {
        const when = days === 0 ? 'is today' : `in ${days} day${days === 1 ? '' : 's'}`
        alerts.push({ id: `exam-${exam.id}-${days}`, emoji: '🎯', title: exam.title, body: `Exam ${when}${exam.tentativeMonth && !exam.date ? ' (estimated)' : ''}.` })
      }
    }
    return alerts.filter((a) => !dismissed.has(a.id))
  }, [state.events, state.exams, state.settings.examReminderDays, dismissed])

  // Fire a real browser notification (if permitted) once per item per
  // session — this is a front-end-only PWA, so it can only ever catch
  // "today" while the app happens to be open.
  useEffect(() => {
    for (const alert of todayAlerts) {
      if (notifiedRef.current.has(alert.id)) continue
      notifiedRef.current.add(alert.id)
      fireNotification(`${alert.emoji} ${alert.title}`, alert.body, alert.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayAlerts])

  function dismissAlert(id) {
    setDismissed((prev) => new Set(prev).add(id))
  }

  return (
    <div className="app-shell">
      <Toast />
      <Sidebar active={tab} onNavigate={setTab} appName={state.settings.appName} />
      <main className="main-area">
        <div className="topbar">
          <h1>
            <span>{icon}</span> {label}
          </h1>
          <div className="muted">
            {state.settings.studentName} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="accent-rule" />

        {todayAlerts.map((alert) => (
          <div className="banner-alert" key={alert.id}>
            <span className="banner-emoji">{alert.emoji}</span>
            <div className="grow">
              <strong>{alert.title}</strong>
              <p>{alert.body}</p>
            </div>
            <button className="icon-btn" onClick={() => dismissAlert(alert.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}

        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'subjects' && <Subjects onNavigate={setTab} />}
        {tab === 'studylog' && <StudyLog />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'exams' && <Exams />}
        {tab === 'methods' && <Methods />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
