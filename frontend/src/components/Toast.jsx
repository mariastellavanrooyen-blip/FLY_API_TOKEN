import React, { useEffect } from 'react'
import { useStore } from '../state/store.jsx'

export default function Toast() {
  const { state, dispatch } = useStore()
  const toast = state.uiToast

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 9000)
    return () => clearTimeout(timer)
  }, [toast, dispatch])

  if (!toast) return null

  return (
    <div className="toast-wrap" role="status" onClick={() => dispatch({ type: 'DISMISS_TOAST' })}>
      <div className="toast-card">
        <span className="toast-emoji">{toast.emoji || '🐰'}</span>
        <div className="grow">
          <strong>{toast.title}</strong>
          <p>{toast.body}</p>
        </div>
        <button className="icon-btn" onClick={() => dispatch({ type: 'DISMISS_TOAST' })} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  )
}
