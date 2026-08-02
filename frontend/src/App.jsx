import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Assignments from './components/Assignments.jsx'
import Goals from './components/Goals.jsx'
import Library from './components/Library.jsx'
import ModulesAssistant from './components/ModulesAssistant.jsx'
import NotesQuiz from './components/NotesQuiz.jsx'
import Tips from './components/Tips.jsx'
import Timer from './components/Timer.jsx'
import Habits from './components/Habits.jsx'
import Settings from './components/Settings.jsx'
import { useStore } from './state/store.jsx'

const TITLES = {
  dashboard: ['🏠', 'Dashboard'],
  assignments: ['✅', 'Assignments'],
  goals: ['🎯', 'Goals'],
  library: ['📦', 'My Burrow'],
  modules: ['🤖', 'Modules & Assistant'],
  notes: ['📝', 'Notes & Quiz Generator'],
  tips: ['💡', 'Study Tips'],
  timer: ['⏱️', 'Study Timer'],
  habits: ['🔥', 'Habit Tracker'],
  settings: ['⚙️', 'Settings'],
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [pendingDoc, setPendingDoc] = useState(null)
  const { state } = useStore()
  const [icon, label] = TITLES[tab]

  function sendDocToNotes(doc) {
    setPendingDoc(doc)
    setTab('notes')
  }

  return (
    <div className="app-shell">
      <Sidebar active={tab} onNavigate={setTab} />
      <main className="main-area">
        <div className="topbar">
          <h1>
            <span>{icon}</span> {label}
          </h1>
          <div className="muted">
            Hi {state.settings.displayName || 'there'} 🐰 — {state.modules.map((m) => m.name).join(' · ')}
          </div>
        </div>
        <div className="rainbow-rule" />
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'assignments' && <Assignments />}
        {tab === 'goals' && <Goals />}
        {tab === 'library' && <Library onSendToNotes={sendDocToNotes} />}
        {tab === 'modules' && <ModulesAssistant />}
        {tab === 'notes' && <NotesQuiz pendingDoc={pendingDoc} onConsumePendingDoc={() => setPendingDoc(null)} />}
        {tab === 'tips' && <Tips />}
        {tab === 'timer' && <Timer />}
        {tab === 'habits' && <Habits />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
