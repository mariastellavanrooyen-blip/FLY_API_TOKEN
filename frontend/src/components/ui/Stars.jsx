import React from 'react'

// A 1-5 confidence/understanding rating. Interactive when onChange is given,
// read-only display otherwise.
export default function Stars({ value = 0, onChange, size = 5 }) {
  return (
    <div className={`stars${onChange ? '' : ' readonly'}`}>
      {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'filled' : ''}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
