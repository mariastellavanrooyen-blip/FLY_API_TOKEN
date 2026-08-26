import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import EmptyState from './ui/EmptyState.jsx'
import BarBreakdown from './ui/BarBreakdown.jsx'
import { useBudgetMath } from '../lib/budgetMath.js'
import { formatMoney, monthKeyOf, currentMonthKey, addMonths, formatMonthLabel, formatDateShort, todayKey } from '../lib/utils.js'

const SUB_TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'income', label: '💵 Income' },
  { id: 'expenses', label: '🧾 Expenses' },
  { id: 'reports', label: '📈 Reports' },
]

export default function Budget() {
  const { state } = useStore()
  const [sub, setSub] = useState('overview')
  const math = useBudgetMath(state.budget)

  return (
    <div>
      <div className="tab-strip">
        {SUB_TABS.map((t) => (
          <button key={t.id} className={sub === t.id ? 'active' : ''} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === 'overview' && <Overview math={math} />}
      {sub === 'income' && <IncomeTab math={math} />}
      {sub === 'expenses' && <ExpensesTab math={math} />}
      {sub === 'reports' && <ReportsTab math={math} />}
    </div>
  )
}

function StatTile({ label, value, tone, sub }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` tone-${tone}` : ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function Overview({ math }) {
  const { state } = useStore()
  const monthKey = currentMonthKey()
  const { settings } = state
  const incomeA = math.incomeForMonth(monthKey, 'a')
  const incomeB = math.incomeForMonth(monthKey, 'b')
  const totalIncome = incomeA + incomeB
  const totalExpenses = math.totalExpensesForMonth(monthKey)
  const unpaidTotal = math.totalUnpaidForMonth(monthKey)
  const balance = totalIncome - totalExpenses
  const breakdown = math.categoryBreakdown(monthKey)

  return (
    <div>
      <div className="grid cols-4">
        <StatTile label={`${settings.partnerAName}'s income`} value={formatMoney(incomeA, settings.currencySymbol)} />
        <StatTile label={`${settings.partnerBName}'s income`} value={formatMoney(incomeB, settings.currencySymbol)} />
        <StatTile label="Paid so far" value={formatMoney(totalExpenses, settings.currencySymbol)} tone={totalExpenses > totalIncome ? 'bad' : undefined} />
        <StatTile
          label="Left over this month"
          value={formatMoney(balance, settings.currencySymbol)}
          tone={balance >= 0 ? 'good' : 'bad'}
          sub={
            unpaidTotal > 0
              ? `+ ${formatMoney(unpaidTotal, settings.currencySymbol)} still to pay`
              : `of ${formatMoney(totalIncome, settings.currencySymbol)} total income`
          }
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">🧾 Where {formatMonthLabel(monthKey)}'s money is going</div>
        {breakdown.length === 0 ? (
          <EmptyState emoji="🧾" title="No expenses logged this month yet" subtitle="Add your first one from the Expenses tab." />
        ) : (
          <BarBreakdown rows={breakdown} categories={settings.expenseCategories} currencySymbol={settings.currencySymbol} total={totalExpenses} />
        )}
      </div>
    </div>
  )
}

function IncomeTab({ math }) {
  const { state, dispatch } = useStore()
  const { settings, budget } = state
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [recurringForm, setRecurringForm] = useState(null)
  const [extraForm, setExtraForm] = useState(null)

  function saveRecurring(e) {
    e.preventDefault()
    if (!recurringForm.label.trim() || !recurringForm.amount) return
    if (recurringForm.id) dispatch({ type: 'UPDATE_RECURRING_INCOME', payload: recurringForm })
    else dispatch({ type: 'ADD_RECURRING_INCOME', payload: recurringForm })
    setRecurringForm(null)
  }

  function saveExtra(e) {
    e.preventDefault()
    if (!extraForm.label.trim() || !extraForm.amount) return
    if (extraForm.id) dispatch({ type: 'UPDATE_EXTRA_INCOME', payload: extraForm })
    else dispatch({ type: 'ADD_EXTRA_INCOME', payload: extraForm })
    setExtraForm(null)
  }

  const extrasThisMonth = budget.extraIncomes.filter((i) => monthKeyOf(i.date) === monthKey)

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="section-title">🔁 Regular monthly income</div>
        <p className="muted" style={{ marginTop: -6 }}>
          Salaries and any income you get every month, counted automatically each month — split by who earns it.
        </p>
        {budget.recurringIncomes.length === 0 && <EmptyState emoji="💵" title="No regular income added yet" />}
        {budget.recurringIncomes.map((i) => (
          <div className="list-row" key={i.id}>
            <div className="grow">
              <h4>{i.label}</h4>
              <span className="muted">{i.person === 'a' ? settings.partnerAName : settings.partnerBName}</span>
            </div>
            <strong>{formatMoney(i.amount, settings.currencySymbol)}</strong>
            <button className="icon-btn" onClick={() => setRecurringForm(i)}>✏️</button>
            <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_RECURRING_INCOME', payload: { id: i.id } })}>🗑️</button>
          </div>
        ))}

        {!recurringForm && (
          <button className="btn small" onClick={() => setRecurringForm({ person: 'a', label: '', amount: '' })}>
            + Add regular income
          </button>
        )}
        {recurringForm && (
          <form onSubmit={saveRecurring} style={{ marginTop: 12, borderTop: '2px dashed var(--beige-deep)', paddingTop: 12 }}>
            <div className="field-row">
              <div className="field">
                <label>Who earns it</label>
                <select value={recurringForm.person} onChange={(e) => setRecurringForm({ ...recurringForm, person: e.target.value })}>
                  <option value="a">{settings.partnerAName}</option>
                  <option value="b">{settings.partnerBName}</option>
                </select>
              </div>
              <div className="field">
                <label>Monthly amount</label>
                <input type="number" step="0.01" min="0" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Label</label>
              <input autoFocus value={recurringForm.label} onChange={(e) => setRecurringForm({ ...recurringForm, label: e.target.value })} placeholder="e.g. Salary" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">{recurringForm.id ? 'Save' : 'Add'}</button>
              <button className="btn ghost" type="button" onClick={() => setRecurringForm(null)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="section-title">✨ Additional income</div>
        <div className="calendar-head" style={{ marginBottom: 10 }}>
          <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, -1))}>←</button>
          <div className="month-label">{formatMonthLabel(monthKey)}</div>
          <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, 1))}>→</button>
        </div>
        {extrasThisMonth.length === 0 && <EmptyState emoji="✨" title="No extra income this month" subtitle="Bonuses, side jobs, gifts — anything one-off." />}
        {extrasThisMonth.map((i) => (
          <div className="list-row" key={i.id}>
            <div className="grow">
              <h4>{i.label}</h4>
              <span className="muted">{i.person === 'a' ? settings.partnerAName : settings.partnerBName} · {formatDateShort(i.date)}</span>
            </div>
            <strong>{formatMoney(i.amount, settings.currencySymbol)}</strong>
            <button className="icon-btn" onClick={() => setExtraForm(i)}>✏️</button>
            <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_EXTRA_INCOME', payload: { id: i.id } })}>🗑️</button>
          </div>
        ))}

        {!extraForm && (
          <button className="btn small" onClick={() => setExtraForm({ person: 'a', label: '', amount: '', date: todayKey() })}>
            + Add extra income
          </button>
        )}
        {extraForm && (
          <form onSubmit={saveExtra} style={{ marginTop: 12, borderTop: '2px dashed var(--beige-deep)', paddingTop: 12 }}>
            <div className="field-row">
              <div className="field">
                <label>Who</label>
                <select value={extraForm.person} onChange={(e) => setExtraForm({ ...extraForm, person: e.target.value })}>
                  <option value="a">{settings.partnerAName}</option>
                  <option value="b">{settings.partnerBName}</option>
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <input type="number" step="0.01" min="0" value={extraForm.amount} onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Label</label>
                <input autoFocus value={extraForm.label} onChange={(e) => setExtraForm({ ...extraForm, label: e.target.value })} placeholder="e.g. Freelance work" />
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={extraForm.date} onChange={(e) => setExtraForm({ ...extraForm, date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">{extraForm.id ? 'Save' : 'Add'}</button>
              <button className="btn ghost" type="button" onClick={() => setExtraForm(null)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ExpensesTab({ math }) {
  const { state, dispatch } = useStore()
  const { settings } = state
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [form, setForm] = useState(null)
  const [newCategory, setNewCategory] = useState('')

  // Unpaid bills float to the top (soonest due first) so the "still owe
  // this" list reads like a to-do list; paid ones sink below it, most
  // recently paid first, already scratched off.
  const expenses = math
    .expensesForMonth(monthKey)
    .slice()
    .sort((a, b) => {
      const ap = math.isPaid(a)
      const bp = math.isPaid(b)
      if (ap !== bp) return ap ? 1 : -1
      return ap ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    })
  const paidTotal = math.totalExpensesForMonth(monthKey)
  const unpaidTotal = math.totalUnpaidForMonth(monthKey)
  const unpaidCount = math.unpaidExpensesForMonth(monthKey).length

  function togglePaid(ex) {
    const nowPaid = !math.isPaid(ex)
    dispatch({ type: 'UPDATE_EXPENSE', payload: { id: ex.id, paid: nowPaid, paidDate: nowPaid ? todayKey() : null } })
  }

  function save(e) {
    e.preventDefault()
    if (!form.label.trim() || !form.amount) return
    if (form.id) dispatch({ type: 'UPDATE_EXPENSE', payload: form })
    else dispatch({ type: 'ADD_EXPENSE', payload: form })
    setForm(null)
  }

  function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    dispatch({ type: 'ADD_CATEGORY', payload: { name } })
    setForm({ ...form, category: name })
    setNewCategory('')
  }

  return (
    <div className="card">
      <div className="calendar-head" style={{ marginBottom: 6 }}>
        <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, -1))}>← Prev</button>
        <div className="month-label">{formatMonthLabel(monthKey)}</div>
        <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, 1))}>Next →</button>
      </div>
      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <div className="stat-tile" style={{ textAlign: 'center' }}>
          <div className="stat-label">Still to pay</div>
          <div className="stat-value tone-bad">{formatMoney(unpaidTotal, settings.currencySymbol)}</div>
          <div className="stat-sub">{unpaidCount} bill{unpaidCount === 1 ? '' : 's'} left to tick off</div>
        </div>
        <div className="stat-tile" style={{ textAlign: 'center' }}>
          <div className="stat-label">Already paid</div>
          <div className="stat-value tone-good">{formatMoney(paidTotal, settings.currencySymbol)}</div>
          <div className="stat-sub">counts toward this month's report</div>
        </div>
      </div>

      {expenses.length === 0 && <EmptyState emoji="🧾" title="Nothing here yet" subtitle="Add your bills for the month, then tick them off as you pay each one." />}
      {expenses.map((ex) => {
        const paid = math.isPaid(ex)
        return (
          <div className="list-row" key={ex.id}>
            <input type="checkbox" style={{ width: 20, height: 20, flexShrink: 0, accentColor: 'var(--sage)' }} checked={paid} onChange={() => togglePaid(ex)} title={paid ? 'Mark as still to pay' : 'Mark as paid'} />
            <div className="grow">
              <h4 style={paid ? { textDecoration: 'line-through', color: 'var(--ink-soft)' } : undefined}>{ex.label}</h4>
              <span className="muted">{formatDateShort(ex.date)}</span>
            </div>
            <span className="badge">{ex.category}</span>
            <strong style={paid ? { color: 'var(--ink-soft)' } : undefined}>{formatMoney(ex.amount, settings.currencySymbol)}</strong>
            <button className="icon-btn" onClick={() => setForm(ex)}>✏️</button>
            <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: { id: ex.id } })}>🗑️</button>
          </div>
        )
      })}

      {!form && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn small" onClick={() => setForm({ category: settings.expenseCategories[0], label: '', amount: '', date: todayKey(), paid: false })}>
            + Add a bill to pay
          </button>
          <button className="btn secondary small" onClick={() => setForm({ category: settings.expenseCategories[0], label: '', amount: '', date: todayKey(), paid: true })}>
            + Log something already paid
          </button>
        </div>
      )}
      {form && (
        <form onSubmit={save} style={{ marginTop: 12, borderTop: '2px dashed var(--beige-deep)', paddingTop: 12 }}>
          {!form.id && (
            <p className="muted" style={{ marginTop: -4 }}>
              {form.paid ? "This counts as spent right away." : "This will show as \"still to pay\" until you tick it off."}
            </p>
          )}
          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {settings.expenseCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div className="field" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label>New category (optional)</label>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Pets" />
            </div>
            <button type="button" className="btn secondary small" onClick={addCategory}>Add category</button>
          </div>
          <div className="field-row">
            <div className="field">
              <label>What is it for</label>
              <input autoFocus value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Electricity bill" />
            </div>
            <div className="field">
              <label>{form.paid ? 'Date paid' : 'Due date'}</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit">{form.id ? 'Save' : 'Add'}</button>
            <button className="btn ghost" type="button" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

function ReportsTab({ math }) {
  const { state } = useStore()
  const { settings } = state
  const [monthKey, setMonthKey] = useState(currentMonthKey())

  const incomeA = math.incomeForMonth(monthKey, 'a')
  const incomeB = math.incomeForMonth(monthKey, 'b')
  const totalIncome = incomeA + incomeB
  const totalExpenses = math.totalExpensesForMonth(monthKey)
  const unpaidTotal = math.totalUnpaidForMonth(monthKey)
  const balance = totalIncome - totalExpenses
  const breakdown = math.categoryBreakdown(monthKey)

  const trend = useMemo(() => {
    const out = []
    let m = monthKey
    for (let i = 0; i < 6; i++) {
      out.unshift({ monthKey: m, balance: math.balanceForMonth(m) })
      m = addMonths(m, -1)
    }
    return out
  }, [monthKey, math])
  const maxAbs = Math.max(...trend.map((t) => Math.abs(t.balance)), 1)

  return (
    <div>
      <div className="calendar-head" style={{ marginBottom: 16 }}>
        <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, -1))}>← Prev</button>
        <div className="month-label">{formatMonthLabel(monthKey)} report</div>
        <button className="btn ghost small" onClick={() => setMonthKey((m) => addMonths(m, 1))}>Next →</button>
      </div>

      <div className="grid cols-4">
        <StatTile label={settings.partnerAName} value={formatMoney(incomeA, settings.currencySymbol)} />
        <StatTile label={settings.partnerBName} value={formatMoney(incomeB, settings.currencySymbol)} />
        <StatTile label="Total income" value={formatMoney(totalIncome, settings.currencySymbol)} />
        <StatTile label="Paid so far" value={formatMoney(totalExpenses, settings.currencySymbol)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">
          {balance >= 0 ? '✅' : '⚠️'} Balance for {formatMonthLabel(monthKey)}
        </div>
        <div className={`stat-value tone-${balance >= 0 ? 'good' : 'bad'}`} style={{ fontSize: '2rem' }}>
          {formatMoney(balance, settings.currencySymbol)}
        </div>
        <p className="muted">{balance >= 0 ? "You're within budget this month." : 'Spending is ahead of income this month.'}</p>
        {unpaidTotal > 0 && (
          <p className="muted">
            Doesn't yet include <strong style={{ color: 'var(--ink)' }}>{formatMoney(unpaidTotal, settings.currencySymbol)}</strong> in bills you
            haven't ticked off as paid yet — see the Expenses tab.
          </p>
        )}
      </div>

      <div className="card">
        <div className="section-title">🧾 Spend by category</div>
        {breakdown.length === 0 ? (
          <EmptyState emoji="🧾" title="Nothing logged for this month" />
        ) : (
          <BarBreakdown rows={breakdown} categories={settings.expenseCategories} currencySymbol={settings.currencySymbol} total={totalExpenses} />
        )}
      </div>

      <div className="card">
        <div className="section-title">📈 Last 6 months</div>
        {trend.map((t) => (
          <div className="bar-row" key={t.monthKey}>
            <div className="bar-label">
              <span>{formatMonthLabel(t.monthKey)}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.max(4, (Math.abs(t.balance) / maxAbs) * 100)}%`,
                  background: t.balance >= 0 ? 'var(--good)' : 'var(--danger)',
                }}
              />
            </div>
            <div className="bar-value">{formatMoney(t.balance, settings.currencySymbol)}</div>
          </div>
        ))}
        <p className="muted" style={{ marginTop: 8 }}>
          Every income and expense entry stays saved, so this report is always calculated fresh from your real data — nothing to separately "save".
        </p>
      </div>
    </div>
  )
}
