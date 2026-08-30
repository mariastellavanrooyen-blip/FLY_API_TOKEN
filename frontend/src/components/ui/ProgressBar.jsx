import React from 'react'

export default function ProgressBar({ value = 0, tone }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-track">
      <div className={`progress-fill${tone ? ` tone-${tone}` : ''}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
