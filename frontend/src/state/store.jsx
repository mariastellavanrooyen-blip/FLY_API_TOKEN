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

    // --- subjects ---
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, { id: uid(), ...action.payload }] }
    case 'UPDATE_SUBJECT':
      return { ...state, subjects: state.subjects.map((s) => (s.id === action.payload.id ? { ...s, ...action.payload } : s)) }
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.payload.id),
        chapterLogs: state.chapterLogs.filter((l) => l.subjectId !== action.payload.id),
        exams: state.exams.filter((e) => e.subjectId !== action.payload.id),
      }

    // --- chapter log ---
    case 'ADD_LOG':
      return { ...state, chapterLogs: [{ id: uid(), ...action.payload }, ...state.chapterLogs] }
    case 'UPDATE_LOG':
      return { ...state, chapterLogs: state.chapterLogs.map((l) => (l.id === action.payload.id ? { ...l, ...action.payload } : l)) }
    case 'DELETE_LOG':
      return { ...state, chapterLogs: state.chapterLogs.filter((l) => l.id !== action.payload.id) }

    // --- exams / countdowns ---
    case 'ADD_EXAM':
      return { ...state, exams: [...state.exams, { id: uid(), ...action.payload }] }
    case 'UPDATE_EXAM':
      return { ...state, exams: state.exams.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)) }
    case 'DELETE_EXAM':
      return { ...state, exams: state.exams.filter((e) => e.id !== action.payload.id) }

    // --- calendar events ---
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, { id: uid(), ...action.payload }] }
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)) }
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter((e) => e.id !== action.payload.id) }

    // --- study methods ---
    case 'ADD_METHOD': {
      const name = action.payload.name.trim()
      if (!name) return state
      return { ...state, methods: [...state.methods, { id: uid(), name, hint: action.payload.hint || '' }] }
    }
    case 'DELETE_METHOD':
      return { ...state, methods: state.methods.filter((m) => m.id !== action.payload.id) }

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
