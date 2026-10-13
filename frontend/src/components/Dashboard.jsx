import React, { useMemo } from 'react'
import { useStore } from '../state/store.jsx'
import EmptyState from './ui/EmptyState.jsx'
import { useBudgetMath } from '../lib/budgetMath.js'
import { formatMoney, formatDate, currentMonthKey, formatMonthLabel, todayKey, eventCategoryMeta } from '../lib/utils.js'

export default function Dashboard({ onNavigate }) {
  const { state } = useStore()
  const { settings } = state
  const math = useBudgetMath(state.budget)
  const monthKey = currentMonthKey()

  const incomeA = math.incomeForMonth(monthKey, 'a')
  const incomeB = math.incomeForMonth(monthKey, 'b')
  const totalIncome = incomeA + incomeB
  const totalExpenses = math.totalExpensesForMonth(monthKey)
  const balance = totalIncome - totalExpenses

  const upcomingEvents = useMemo(() => {
    const today = todayKey()
    return state.events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      .slice(0, 5)
  }, [state.events])

  const nextTrip = useMemo(() => {
    const today = todayKey()
    return state.shoppingLists
      .filter((l) => l.tripDate && l.tripDate >= today)
      .sort((a, b) => a.tripDate.localeCompare(b.tripDate))[0]
  }, [state.shoppingLists])

  return (
    <div>
      <div className="grid cols-4">
        <div className="stat-tile">
          <div className="stat-label">{formatMonthLabel(monthKey)} balance</div>
          <div className={`stat-value tone-${balance >= 0 ? 'good' : 'bad'}`}>{formatMoney(balance, settings.currencySymbol)}</div>
          <div className="stat-sub">{formatMoney(totalIncome, settings.currencySymbol)} in · {formatMoney(totalExpenses, settings.currencySymbol)} out</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">{settings.partnerAName}'s income</div>
          <div className="stat-value">{formatMoney(incomeA, settings.currencySymbol)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">{settings.partnerBName}'s income</div>
          <div className="stat-value">{formatMoney(incomeB, settings.currencySymbol)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Recipes saved</div>
          <div className="stat-value">{state.recipes.length}</div>
          <div className="stat-sub">in your recipe box</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">📅 Coming up</div>
          {upcomingEvents.length === 0 && <EmptyState emoji="📅" title="Nothing on the calendar" />}
          {upcomingEvents.map((ev) => {
            const meta = eventCategoryMeta(ev.category)
            return (
              <div className="list-row" key={ev.id}>
                <div className="grow">
                  <h4>{ev.title}</h4>
                  <span className="muted">{formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</span>
                </div>
                <span className={`badge tone-${ev.category}`}>{meta.label}</span>
              </div>
            )
          })}
          <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => onNavigate('calendar')}>
            Open calendar →
          </button>
        </div>

        <div className="card">
          <div className="section-title">🛒 Shopping</div>
          {nextTrip ? (
            <p>
              Next planned trip: <strong>{formatDate(nextTrip.tripDate)}</strong> for "{nextTrip.name}" ({nextTrip.items.filter((i) => !i.checked).length} item(s) left to get).
            </p>
          ) : (
            <p className="muted">No shopping trip date planned. Set one so you get a reminder banner on the day.</p>
          )}
          <button className="btn ghost small" onClick={() => onNavigate('shopping')}>
            Open shopping list →
          </button>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="section-title">💰 Budget</div>
          <p className="muted">Full income split, expense log and monthly reports.</p>
          <button className="btn small" onClick={() => onNavigate('budget')}>
            Open budget →
          </button>
        </div>
        <div className="card">
          <div className="section-title">📖 Recipe box</div>
          <p className="muted">Brain-dump meals, ingredients and photos, then send them straight to the shopping list.</p>
          <button className="btn small" onClick={() => onNavigate('recipes')}>
            Open recipe box →
          </button>
        </div>
      </div>
    </div>
  )
}
