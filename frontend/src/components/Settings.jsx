import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { estimateStorage, clearAllImages } from '../lib/db.js'
import { notificationPermission, notificationsSupported, requestNotificationPermission } from '../lib/notify.js'
import ProgressBar from './ui/ProgressBar.jsx'

function formatBytes(n) {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${units[i]}`
}

export default function Settings() {
  const { state, dispatch } = useStore()
  const [storage, setStorage] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [permission, setPermission] = useState(notificationPermission())
  const fileRef = useRef(null)

  useEffect(() => {
    estimateStorage().then(setStorage)
  }, [state.recipes.length])

  function setSetting(patch) {
    dispatch({ type: 'SET_SETTINGS', payload: patch })
  }

  async function enableNotifications() {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    dispatch({ type: 'ADD_CATEGORY', payload: { name } })
    setNewCategory('')
  }

  function removeCategory(name) {
    dispatch({ type: 'DELETE_CATEGORY', payload: { name } })
  }

  async function clearRecipeImages() {
    if (!confirm('Delete all recipe photos? Recipes themselves stay, just without pictures.')) return
    await clearAllImages()
    dispatch({ type: 'SHOW_TOAST', payload: { emoji: '🧹', title: 'Photos cleared', body: 'All recipe photos were removed.' } })
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wifes-brain-backup-${new Date().toISOString().slice(0, 10)}.json`
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
        <div className="section-title">👪 Household</div>
        <div className="field">
          <label>App/household name</label>
          <input value={state.settings.householdName} onChange={(e) => setSetting({ householdName: e.target.value })} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Your name (Partner A)</label>
            <input value={state.settings.partnerAName} onChange={(e) => setSetting({ partnerAName: e.target.value })} />
          </div>
          <div className="field">
            <label>Partner's name (Partner B)</label>
            <input value={state.settings.partnerBName} onChange={(e) => setSetting({ partnerBName: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Currency symbol</label>
          <input style={{ maxWidth: 100 }} value={state.settings.currencySymbol} onChange={(e) => setSetting({ currencySymbol: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <div className="section-title">🧾 Budget categories</div>
        <p className="muted" style={{ marginTop: -4 }}>Used for tagging expenses and the report breakdown. You can also add one on the fly from the Expenses tab.</p>
        {state.settings.expenseCategories.map((c) => (
          <span key={c} className="badge" style={{ marginRight: 6, marginBottom: 6, display: 'inline-flex' }}>
            {c}
            <button className="icon-btn" style={{ padding: '0 0 0 4px' }} onClick={() => removeCategory(c)} aria-label={`Remove ${c}`}>✕</button>
          </span>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
          <button className="btn secondary small" onClick={addCategory}>Add</button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">🔔 Shopping-day reminders</div>
        <p className="muted" style={{ marginTop: -4 }}>
          When you open the app on a day you've marked as a shopping trip, you'll always see a reminder banner. Turning on browser
          notifications adds a pop-up too — useful if you keep the app open in a background tab.
        </p>
        {!notificationsSupported() ? (
          <p className="muted">This browser doesn't support notifications — the in-app banner will still work.</p>
        ) : permission === 'granted' ? (
          <span className="badge tone-good">Notifications on ✅</span>
        ) : permission === 'denied' ? (
          <span className="badge tone-bad">Blocked — enable it in your browser's site settings</span>
        ) : (
          <button className="btn secondary small" onClick={enableNotifications}>Enable notifications</button>
        )}
      </div>

      <div className="card">
        <div className="section-title">💾 Your data</div>
        <p className="muted" style={{ marginTop: -4 }}>
          Everything — calendar, budget, recipes, shopping lists — is stored only on this device. Data does <strong>not</strong> automatically
          sync between your tablet and PC; export a backup here and import it on the other device to move it across, or after switching browsers.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={exportData}>⬇️ Export backup</button>
          <button className="btn secondary" onClick={() => fileRef.current?.click()}>⬆️ Import backup</button>
          <input type="file" accept="application/json" ref={fileRef} style={{ display: 'none' }} onChange={importData} />
          <button
            className="btn danger"
            onClick={async () => {
              if (confirm('This clears everything — calendar, budget, recipes and shopping lists. Export a backup first?')) {
                await clearAllImages()
                dispatch({ type: 'RESET_STATE' })
              }
            }}
          >
            🗑️ Reset all data
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">📷 Recipe photo storage</div>
        <p className="muted" style={{ marginTop: -4 }}>Recipe photos are stored on-device, separately from the rest of your data (backups above don't include them).</p>
        {storage?.quota ? (
          <>
            <ProgressBar value={(storage.usage / storage.quota) * 100} />
            <p className="muted" style={{ marginTop: 6 }}>{formatBytes(storage.usage)} used of roughly {formatBytes(storage.quota)} available on this device.</p>
          </>
        ) : (
          <p className="muted">Storage usage isn't reported by this browser.</p>
        )}
        <button className="btn danger small" onClick={clearRecipeImages}>🗑️ Clear all recipe photos</button>
      </div>

      <div className="card">
        <div className="section-title">🍲 About</div>
        <p className="muted">
          The Wife's Brain is your household command centre — a shared calendar for family and kids' things, a two-income budget
          tracker with monthly reports, a recipe box with photos, and a shopping list with trip-day reminders. Install it from your
          browser's menu on both your tablet and PC to use it like a real app, offline.
        </p>
      </div>
    </div>
  )
}
