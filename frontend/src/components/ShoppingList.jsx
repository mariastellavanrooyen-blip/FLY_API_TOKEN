import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import EmptyState from './ui/EmptyState.jsx'
import { formatDate, todayKey } from '../lib/utils.js'

export default function ShoppingList() {
  const { state, dispatch } = useStore()
  const [activeId, setActiveId] = useState(state.shoppingLists[0]?.id || null)
  const [newItemText, setNewItemText] = useState('')
  const [newListName, setNewListName] = useState('')

  const active = state.shoppingLists.find((l) => l.id === activeId) || state.shoppingLists[0]

  function createList() {
    const name = newListName.trim() || 'New list'
    dispatch({ type: 'ADD_SHOPPING_LIST', payload: { name } })
    setNewListName('')
  }

  function addItem(e) {
    e.preventDefault()
    if (!newItemText.trim() || !active) return
    dispatch({ type: 'ADD_SHOPPING_ITEMS', payload: { listId: active.id, items: [newItemText.trim()] } })
    setNewItemText('')
  }

  function toggleItem(item) {
    dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { listId: active.id, itemId: item.id, patch: { checked: !item.checked } } })
  }

  function deleteList(list) {
    if (!confirm(`Delete "${list.name}"?`)) return
    dispatch({ type: 'DELETE_SHOPPING_LIST', payload: { id: list.id } })
    if (activeId === list.id) setActiveId(null)
  }

  const checkedCount = active ? active.items.filter((i) => i.checked).length : 0

  return (
    <div className="grid cols-2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
      <div className="card">
        <div className="section-title">🛒 Your lists</div>
        {state.shoppingLists.map((l) => (
          <div
            className="list-row"
            key={l.id}
            style={{ cursor: 'pointer', borderColor: active?.id === l.id ? 'var(--sage)' : undefined }}
            onClick={() => setActiveId(l.id)}
          >
            <div className="grow">
              <h4>{l.name}</h4>
              <span className="muted">
                {l.items.filter((i) => i.checked).length}/{l.items.length} ticked
                {l.tripDate ? ` · shop on ${formatDate(l.tripDate)}` : ''}
                {l.recurring ? ' 🔁' : ''}
              </span>
            </div>
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteList(l) }}>🗑️</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input placeholder="New list name" value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createList()} />
          <button className="btn secondary small" onClick={createList}>+ New</button>
        </div>
      </div>

      <div className="card">
        {!active ? (
          <EmptyState emoji="🛒" title="Create a shopping list to get started" />
        ) : (
          <>
            <div className="section-title">{active.name}</div>

            <div className="field-row" style={{ marginBottom: 14 }}>
              <div className="field">
                <label>Planned shopping trip date</label>
                <input
                  type="date"
                  value={active.tripDate || ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_SHOPPING_LIST', payload: { id: active.id, tripDate: e.target.value || null, lastAcknowledged: null } })}
                />
              </div>
              <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, fontWeight: 600, color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    style={{ width: 18, height: 18 }}
                    checked={!!active.recurring}
                    onChange={(e) => dispatch({ type: 'UPDATE_SHOPPING_LIST', payload: { id: active.id, recurring: e.target.checked } })}
                  />
                  Repeats monthly (e.g. payday big shop)
                </label>
              </div>
            </div>
            {active.tripDate && (
              <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
                {active.tripDate === todayKey()
                  ? "That's today — you'll see a reminder banner when you open the app."
                  : `A reminder banner shows automatically when you open the app on ${formatDate(active.tripDate)}.`}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="muted">{checkedCount}/{active.items.length} ticked off</span>
              <button className="btn ghost small" onClick={() => dispatch({ type: 'RESET_SHOPPING_CHECKS', payload: { listId: active.id } })}>
                ↺ Reset ticks (reuse this list)
              </button>
            </div>

            {active.items.length === 0 && <EmptyState emoji="✏️" title="No items yet" subtitle="Add items below, or add a recipe's ingredients from the Recipe Box." />}
            {active.items.map((item) => (
              <div className={`check-row${item.checked ? ' checked' : ''}`} key={item.id}>
                <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item)} />
                <span className="item-text">{item.text}</span>
                <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_SHOPPING_ITEM', payload: { listId: active.id, itemId: item.id } })}>✕</button>
              </div>
            ))}

            <form onSubmit={addItem} style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <input placeholder="Add an item…" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} />
              <button className="btn small" type="submit">Add</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
