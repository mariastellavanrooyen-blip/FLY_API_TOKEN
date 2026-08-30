import React from 'react'

export default function EmptyState({ emoji = '🌸', title, subtitle }) {
  return (
    <div className="empty-state">
      <span className="big-emoji">{emoji}</span>
      <strong>{title}</strong>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  )
}
