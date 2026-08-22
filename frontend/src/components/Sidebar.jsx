import React from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'recipes', label: 'Recipe Box', icon: '📖' },
  { id: 'shopping', label: 'Shopping List', icon: '🛒' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ active, onNavigate, householdName }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="pot">🍲</span>
        <span>{householdName || "The Wife's Brain"}</span>
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
        <span className="decor-garden">🌿</span>
      </div>
    </nav>
  )
}
