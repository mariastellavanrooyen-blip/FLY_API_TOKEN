import React, { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import CalendarView from './components/CalendarView.jsx'
import Budget from './components/Budget.jsx'
import Recipes from './components/Recipes.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import Settings from './components/Settings.jsx'
import Toast from './components/Toast.jsx'
import { useStore } from './state/store.jsx'
import { todayKey, nextMonthSameDay } from './lib/utils.js'
import { fireShoppingNotification } from './lib/notify.js'

const TITLES = {
  dashboard: ['🏠', 'Dashboard'],
  calendar: ['📅', 'Calendar'],
  budget: ['💰', 'Budget'],
  recipes: ['📖', 'Recipe Box'],
  shopping: ['🛒', 'Shopping List'],
  settings: ['⚙️', 'Settings'],
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { state, dispatch } = useStore()
  const [icon, label] = TITLES[tab]
  const notifiedRef = useRef(new Set())

  // Roll a passed recurring trip date forward to its next occurrence, and
  // fire the trip-day reminder (once per list per session) for anything due
  // today. Runs once on load — this is a PWA with no server, so it can only
  // ever catch "today" while the app happens to be open.
  useEffect(() => {
    const today = todayKey()
    state.shoppingLists.forEach((list) => {
      if (list.recurring && list.tripDate && list.tripDate < today) {
        let next = list.tripDate
        while (next < today) next = nextMonthSameDay(next)
        dispatch({ type: 'UPDATE_SHOPPING_LIST', payload: { id: list.id, tripDate: next, lastAcknowledged: null } })
        return
      }
      if (list.tripDate === today && list.lastAcknowledged !== today && !notifiedRef.current.has(list.id)) {
        notifiedRef.current.add(list.id)
        fireShoppingNotification(list)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dueToday = state.shoppingLists.filter((l) => l.tripDate === todayKey() && l.lastAcknowledged !== todayKey())

  function acknowledgeList(listId) {
    dispatch({ type: 'UPDATE_SHOPPING_LIST', payload: { id: listId, lastAcknowledged: todayKey() } })
  }

  return (
    <div className="app-shell">
      <Toast />
      <Sidebar active={tab} onNavigate={setTab} householdName={state.settings.householdName} />
      <main className="main-area">
        <div className="topbar">
          <h1>
            <span>{icon}</span> {label}
          </h1>
          <div className="muted">
            {state.settings.partnerAName} &amp; {state.settings.partnerBName} 🍲 {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="garden-rule" />

        {dueToday.map((list) => (
          <div className="banner-alert" key={list.id}>
            <span className="banner-emoji">🛒</span>
            <div className="grow">
              <strong>Today's the day! "{list.name}"</strong>
              <p>
                {list.items.length} item{list.items.length === 1 ? '' : 's'} on your list — don't forget it before you head out.
              </p>
            </div>
            <button className="btn secondary small" onClick={() => setTab('shopping')}>
              Open list
            </button>
            <button className="icon-btn" onClick={() => acknowledgeList(list.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}

        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'budget' && <Budget />}
        {tab === 'recipes' && <Recipes />}
        {tab === 'shopping' && <ShoppingList />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
