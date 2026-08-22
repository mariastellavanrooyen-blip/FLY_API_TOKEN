import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { uid } from '../lib/utils.js'
import { STORAGE_KEY, makeDefaultState } from './defaultState.js'

const StoreContext = createContext(null)

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDefaultState()
    const parsed = JSON.parse(raw)
    // shallow-merge so newly added default fields (e.g. after an app update) still exist
    const def = makeDefaultState()
    return {
      ...def,
      ...parsed,
      settings: { ...def.settings, ...parsed.settings },
      budget: { ...def.budget, ...parsed.budget },
    }
  } catch {
    return makeDefaultState()
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'RESET_STATE':
      return makeDefaultState()

    case 'IMPORT_STATE':
      return { ...makeDefaultState(), ...action.payload }

    // --- calendar events ---
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, { id: uid(), ...action.payload }] }
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)) }
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter((e) => e.id !== action.payload.id) }

    // --- budget: recurring incomes ---
    case 'ADD_RECURRING_INCOME':
      return {
        ...state,
        budget: { ...state.budget, recurringIncomes: [...state.budget.recurringIncomes, { id: uid(), ...action.payload }] },
      }
    case 'UPDATE_RECURRING_INCOME':
      return {
        ...state,
        budget: {
          ...state.budget,
          recurringIncomes: state.budget.recurringIncomes.map((i) => (i.id === action.payload.id ? { ...i, ...action.payload } : i)),
        },
      }
    case 'DELETE_RECURRING_INCOME':
      return {
        ...state,
        budget: { ...state.budget, recurringIncomes: state.budget.recurringIncomes.filter((i) => i.id !== action.payload.id) },
      }

    // --- budget: one-off / extra incomes ---
    case 'ADD_EXTRA_INCOME':
      return { ...state, budget: { ...state.budget, extraIncomes: [...state.budget.extraIncomes, { id: uid(), ...action.payload }] } }
    case 'UPDATE_EXTRA_INCOME':
      return {
        ...state,
        budget: {
          ...state.budget,
          extraIncomes: state.budget.extraIncomes.map((i) => (i.id === action.payload.id ? { ...i, ...action.payload } : i)),
        },
      }
    case 'DELETE_EXTRA_INCOME':
      return { ...state, budget: { ...state.budget, extraIncomes: state.budget.extraIncomes.filter((i) => i.id !== action.payload.id) } }

    // --- budget: expenses ---
    case 'ADD_EXPENSE':
      return { ...state, budget: { ...state.budget, expenses: [...state.budget.expenses, { id: uid(), ...action.payload }] } }
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        budget: { ...state.budget, expenses: state.budget.expenses.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)) },
      }
    case 'DELETE_EXPENSE':
      return { ...state, budget: { ...state.budget, expenses: state.budget.expenses.filter((e) => e.id !== action.payload.id) } }

    // --- budget: categories ---
    case 'ADD_CATEGORY': {
      const name = action.payload.name.trim()
      if (!name || state.settings.expenseCategories.includes(name)) return state
      return { ...state, settings: { ...state.settings, expenseCategories: [...state.settings.expenseCategories, name] } }
    }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        settings: { ...state.settings, expenseCategories: state.settings.expenseCategories.filter((c) => c !== action.payload.name) },
      }

    // --- recipes ---
    case 'ADD_RECIPE':
      return { ...state, recipes: [{ id: uid(), createdAt: new Date().toISOString(), ...action.payload }, ...state.recipes] }
    case 'UPDATE_RECIPE':
      return { ...state, recipes: state.recipes.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload } : r)) }
    case 'DELETE_RECIPE':
      return { ...state, recipes: state.recipes.filter((r) => r.id !== action.payload.id) }

    // --- shopping lists ---
    case 'ADD_SHOPPING_LIST':
      return {
        ...state,
        shoppingLists: [...state.shoppingLists, { id: uid(), items: [], recurring: false, tripDate: null, lastAcknowledged: null, ...action.payload }],
      }
    case 'UPDATE_SHOPPING_LIST':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map((l) => (l.id === action.payload.id ? { ...l, ...action.payload } : l)),
      }
    case 'DELETE_SHOPPING_LIST':
      return { ...state, shoppingLists: state.shoppingLists.filter((l) => l.id !== action.payload.id) }
    case 'ADD_SHOPPING_ITEMS':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map((l) =>
          l.id === action.payload.listId
            ? { ...l, items: [...l.items, ...action.payload.items.map((text) => ({ id: uid(), text, checked: false }))] }
            : l,
        ),
      }
    case 'UPDATE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map((l) =>
          l.id === action.payload.listId
            ? { ...l, items: l.items.map((it) => (it.id === action.payload.itemId ? { ...it, ...action.payload.patch } : it)) }
            : l,
        ),
      }
    case 'DELETE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map((l) =>
          l.id === action.payload.listId ? { ...l, items: l.items.filter((it) => it.id !== action.payload.itemId) } : l,
        ),
      }
    case 'RESET_SHOPPING_CHECKS':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map((l) =>
          l.id === action.payload.listId ? { ...l, items: l.items.map((it) => ({ ...it, checked: false })) } : l,
        ),
      }

    // --- transient in-app notifications ---
    case 'SHOW_TOAST':
      return { ...state, uiToast: action.payload }
    case 'DISMISS_TOAST':
      return { ...state, uiToast: null }

    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable — fail silently, app still works this session
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
