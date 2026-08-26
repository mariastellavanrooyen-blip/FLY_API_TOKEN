import { useMemo } from 'react'
import { monthKeyOf } from './utils.js'

export function useBudgetMath(budget) {
  return useMemo(() => {
    function recurringTotalFor(person) {
      return budget.recurringIncomes.filter((i) => i.person === person).reduce((s, i) => s + Number(i.amount || 0), 0)
    }
    function extraIncomeForMonth(monthKey, person) {
      return budget.extraIncomes
        .filter((i) => monthKeyOf(i.date) === monthKey && (!person || i.person === person))
        .reduce((s, i) => s + Number(i.amount || 0), 0)
    }
    function incomeForMonth(monthKey, person) {
      return recurringTotalFor(person) + extraIncomeForMonth(monthKey, person)
    }
    function expensesForMonth(monthKey) {
      return budget.expenses.filter((e) => monthKeyOf(e.date) === monthKey)
    }
    // Expenses added before the "bills to pay" feature existed have no
    // `paid` field at all — treat those as already paid so nothing that
    // was already counted in a report suddenly disappears from it.
    function isPaid(e) {
      return e.paid !== false
    }
    function paidExpensesForMonth(monthKey) {
      return expensesForMonth(monthKey).filter(isPaid)
    }
    function unpaidExpensesForMonth(monthKey) {
      return expensesForMonth(monthKey).filter((e) => !isPaid(e))
    }
    // "Total spent" means money that has actually left your pocket, so it
    // only counts paid expenses — a bill you haven't paid yet isn't spent.
    function totalExpensesForMonth(monthKey) {
      return paidExpensesForMonth(monthKey).reduce((s, e) => s + Number(e.amount || 0), 0)
    }
    function totalUnpaidForMonth(monthKey) {
      return unpaidExpensesForMonth(monthKey).reduce((s, e) => s + Number(e.amount || 0), 0)
    }
    function categoryBreakdown(monthKey) {
      const rows = {}
      for (const e of paidExpensesForMonth(monthKey)) {
        rows[e.category] = (rows[e.category] || 0) + Number(e.amount || 0)
      }
      return Object.entries(rows)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    }
    function balanceForMonth(monthKey) {
      return incomeForMonth(monthKey, 'a') + incomeForMonth(monthKey, 'b') - totalExpensesForMonth(monthKey)
    }
    return {
      recurringTotalFor,
      extraIncomeForMonth,
      incomeForMonth,
      expensesForMonth,
      paidExpensesForMonth,
      unpaidExpensesForMonth,
      totalExpensesForMonth,
      totalUnpaidForMonth,
      isPaid,
      categoryBreakdown,
      balanceForMonth,
    }
  }, [budget])
}
