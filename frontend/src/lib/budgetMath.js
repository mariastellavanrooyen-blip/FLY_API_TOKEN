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
    function totalExpensesForMonth(monthKey) {
      return expensesForMonth(monthKey).reduce((s, e) => s + Number(e.amount || 0), 0)
    }
    function categoryBreakdown(monthKey) {
      const rows = {}
      for (const e of expensesForMonth(monthKey)) {
        rows[e.category] = (rows[e.category] || 0) + Number(e.amount || 0)
      }
      return Object.entries(rows)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
    }
    function balanceForMonth(monthKey) {
      return incomeForMonth(monthKey, 'a') + incomeForMonth(monthKey, 'b') - totalExpensesForMonth(monthKey)
    }
    return { recurringTotalFor, extraIncomeForMonth, incomeForMonth, expensesForMonth, totalExpensesForMonth, categoryBreakdown, balanceForMonth }
  }, [budget])
}
