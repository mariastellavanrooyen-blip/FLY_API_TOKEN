import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { pingBackend } from '../lib/api.js'
import { estimateStorage, clearAllFileRecords } from '../lib/db.js'
import { formatBytes } from '../lib/extract.js'
import ProgressBar from './ui/ProgressBar.jsx'

export default function Settings() {
  const { state, dispatch } = useStore()
  const [testStatus, setTestStatus] = useState(null)
  const [storage, setStorage] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    estimateStorage().then(setStorage)
  }, [state.documents.length])

  function setSetting(patch) {
    dispatch({ type: 'SET_SETTINGS', payload: patch })
  }

  async function clearLibrary() {
    if (!confirm(`Delete all ${state.documents.length} document(s) stashed in My Burrow? This can't be undone.`)) return
    await clearAllFileRecords()
    dispatch({ type: 'CLEAR_DOCUMENTS' })
  }

  async function testConnection() {
    setTestStatus('testing')
    try {
      await pingBackend(state.settings.backendUrl)
      setTestStatus('ok')
    } catch {
      setTestStatus('fail')
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `burrow-and-brief-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        dispatch({ type: 'IMPORT_STATE', payload: parsed })
      } catch {
        alert('That file could not be read as a valid backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="section-title">👤 Profile</div>
        <div className="field">
          <label>Display name</label>
          <input value={state.settings.displayName} onChange={(e) => setSetting({ displayName: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">🤖 AI assistant &amp; note generation</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Offline mode works instantly with no setup. Real AI mode uses the Claude API through a small backend server you deploy yourself (see the README) — genuinely intelligent notes, quizzes and chat, at a small per-use cost.
        </p>
        <div className="pill-select" style={{ marginBottom: 12 }}>
          <button className={state.settings.aiMode === 'offline' ? 'active' : ''} onClick={() => setSetting({ aiMode: 'offline' })}>
            🐰 Offline (free)
          </button>
          <button className={state.settings.aiMode === 'claude' ? 'active' : ''} onClick={() => setSetting({ aiMode: 'claude' })}>
            ✨ Real AI (Claude API)
          </button>
        </div>
        {state.settings.aiMode === 'claude' && (
          <>
            <div className="field">
              <label>Backend URL</label>
              <input
                placeholder="https://your-app.fly.dev"
                value={state.settings.backendUrl}
                onChange={(e) => setSetting({ backendUrl: e.target.value })}
              />
            </div>
            <button className="btn secondary small" onClick={testConnection} disabled={!state.settings.backendUrl}>
              Test connection
            </button>
            {testStatus === 'ok' && <span className="badge status-done" style={{ marginLeft: 8 }}>Connected ✅</span>}
            {testStatus === 'fail' && <span className="badge status-overdue" style={{ marginLeft: 8 }}>Not reachable</span>}
          </>
        )}
      </div>

      <div className="card">
        <div className="section-title">💾 Your data</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Everything is stored only on this device — assignments, goals, notes and uploaded documents all persist
          automatically between visits. Back up your data before clearing your browser storage.
        </p>
        <p className="muted" style={{ fontSize: '0.75rem' }}>
          Note: the JSON backup below covers assignments, goals, notes, quizzes and habits, plus your document
          <em> list</em> (filenames, status, progress). It does not include the uploaded file contents themselves —
          those live in this browser's storage only, described below.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={exportData}>
            ⬇️ Export backup
          </button>
          <button className="btn secondary" onClick={() => fileRef.current?.click()}>
            ⬆️ Import backup
          </button>
          <input type="file" accept="application/json" ref={fileRef} style={{ display: 'none' }} onChange={importData} />
          <button
            className="btn danger"
            onClick={async () => {
              if (confirm('This clears all assignments, goals, notes, quizzes, habits AND everything in My Burrow. Export a backup first?')) {
                await clearAllFileRecords()
                dispatch({ type: 'RESET_STATE' })
              }
            }}
          >
            🗑️ Reset all data
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">📦 My Burrow storage</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Uploaded documents (PDFs, Word docs, text and photos) are remembered in this browser's on-device storage,
          separate from the rest of the app's data.
        </p>
        <p>
          <strong>{state.documents.length}</strong> document{state.documents.length === 1 ? '' : 's'} stashed
        </p>
        {storage?.quota ? (
          <>
            <ProgressBar value={(storage.usage / storage.quota) * 100} />
            <p className="muted" style={{ marginTop: 6 }}>
              {formatBytes(storage.usage)} used of roughly {formatBytes(storage.quota)} available on this device.
            </p>
          </>
        ) : (
          <p className="muted">Storage usage isn't reported by this browser.</p>
        )}
        <button className="btn danger small" onClick={clearLibrary} disabled={state.documents.length === 0}>
          🗑️ Clear My Burrow only
        </button>
      </div>

      <div className="card">
        <div className="section-title">🐰 About</div>
        <p className="muted">
          Burrow &amp; Brief is a lightweight, private legal-studies companion — assignments, goals, tips, notes and
          quiz generation, an AI assistant, a study timer and a habit tracker, themed in cream, terracotta and soft
          beige with a bunny and rainbow motif. Built for Professional Ethics and Notarial Practice.
        </p>
      </div>
    </div>
  )
}
