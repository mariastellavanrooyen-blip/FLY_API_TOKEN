import React from 'react'
import { categoryColorVar, formatMoney } from '../../lib/utils.js'

// A sorted horizontal bar breakdown for "spend by category". Each row IS its
// own category, so identity is carried by the adjacent text label + swatch
// dot on every row (never color alone) rather than a separate legend box.
export default function BarBreakdown({ rows, categories, currencySymbol, total }) {
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.amount), 1)
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.name}>
          <div className="bar-label">
            <span className="dot" style={{ background: categoryColorVar(categories, r.name) }} />
            <span>{r.name}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max(4, (r.amount / max) * 100)}%`,
                background: categoryColorVar(categories, r.name),
              }}
            />
          </div>
          <div className="bar-value">
            {formatMoney(r.amount, currencySymbol)}
            {total ? <span className="muted"> ({Math.round((r.amount / total) * 100)}%)</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
