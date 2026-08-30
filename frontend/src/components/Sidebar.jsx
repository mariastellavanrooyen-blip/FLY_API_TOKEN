import React from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'subjects', label: 'Subjects', icon: '📗' },
  { id: 'studylog', label: 'Chapter Log', icon: '📝' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'exams', label: 'Exams', icon: '🎯' },
  { id: 'methods', label: 'Study Methods', icon: '🧠' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ active, onNavigate, appName }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="pot">🐇</span>
        <span>{appName || 'ExamReady'}</span>
      </div>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item${active === item.id ? ' active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}
      <div className="sidebar-footer">
        <span className="decor-garden">🌸🐇🌾</span>
      </div>
    </nav>
  )
}
