import React from 'react'

// A sorted horizontal bar breakdown where each row IS its own category, so
// identity is carried by the adjacent text label + swatch dot on every row
// (never color alone) rather than a separate legend box. `rows` is
// [{ id, name, value, display, color }], already sorted by the caller.
export default function IdentityBars({ rows, max }) {
  if (rows.length === 0) return null
  const scale = max ?? Math.max(...rows.map((r) => r.value), 1)
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.id}>
          <div className="bar-label">
            <span className="dot" style={{ background: r.color }} />
            <span>{r.name}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.max(4, (r.value / scale) * 100)}%`, background: r.color }} />
          </div>
          <div className="bar-value">{r.display}</div>
        </div>
      ))}
    </div>
  )
}
