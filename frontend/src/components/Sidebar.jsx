import React from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'assignments', label: 'Assignments', icon: '✅' },
  { id: 'goals', label: 'Goals & Grades', icon: '🎯' },
  { id: 'library', label: 'My Burrow', icon: '📦' },
  { id: 'modules', label: 'Modules & Assistant', icon: '🤖' },
  { id: 'notes', label: 'Notes & Quiz', icon: '📝' },
  { id: 'tips', label: 'Study Tips', icon: '💡' },
  { id: 'timer', label: 'Study Timer', icon: '⏱️' },
  { id: 'habits', label: 'Habit Tracker', icon: '🔥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="bunny">🐰</span>
        <span>Burrow &amp; Brief</span>
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
        <span className="decor-rainbow-arc">🌈</span>
      </div>
    </nav>
  )
}
