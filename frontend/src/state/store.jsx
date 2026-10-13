import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { uid, todayKey } from '../lib/utils.js'
import { STORAGE_KEY, makeDefaultState } from './defaultState.js'

const StoreContext = createContext(null)

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDefaultState()
    const parsed = JSON.parse(raw)
    // shallow-merge so newly added default fields (e.g. after an app update) still exist
    return { ...makeDefaultState(), ...parsed }
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

    // --- modules ---
    case 'UPDATE_MODULE':
      return {
        ...state,
        modules: state.modules.map((m) => (m.id === action.payload.id ? { ...m, ...action.payload } : m)),
      }
    case 'ADD_CHAPTER':
      return {
        ...state,
        modules: state.modules.map((m) =>
          m.id === action.payload.moduleId
            ? { ...m, chapters: [...m.chapters, { id: uid(), title: action.payload.title }] }
            : m,
        ),
      }
    case 'DELETE_CHAPTER':
      return {
        ...state,
        modules: state.modules.map((m) =>
          m.id === action.payload.moduleId
            ? { ...m, chapters: m.chapters.filter((c) => c.id !== action.payload.chapterId) }
            : m,
        ),
      }

    // --- assignments ---
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, { id: uid(), status: 'todo', ...action.payload }] }
    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map((a) => (a.id === action.payload.id ? { ...a, ...action.payload } : a)),
      }
    case 'DELETE_ASSIGNMENT':
      return { ...state, assignments: state.assignments.filter((a) => a.id !== action.payload.id) }

    // --- goals ---
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, { id: uid(), milestones: [], ...action.payload }] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map((g) => (g.id === action.payload.id ? { ...g, ...action.payload } : g)) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload.id) }
    case 'ADD_MILESTONE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, milestones: [...g.milestones, { id: uid(), text: action.payload.text, done: false }] }
            : g,
        ),
      }
    case 'TOGGLE_MILESTONE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? {
                ...g,
                milestones: g.milestones.map((m) =>
                  m.id === action.payload.milestoneId ? { ...m, done: !m.done } : m,
                ),
              }
            : g,
        ),
      }

    // --- grades ---
    case 'ADD_GRADE':
      return { ...state, grades: [action.payload, ...state.grades] }
    case 'UPDATE_GRADE':
      return { ...state, grades: state.grades.map((g) => (g.id === action.payload.id ? { ...g, ...action.payload } : g)) }
    case 'DELETE_GRADE':
      return { ...state, grades: state.grades.filter((g) => g.id !== action.payload.id) }

    // --- tips ---
    case 'TOGGLE_TIP_FAVORITE':
      return {
        ...state,
        favoriteTips: state.favoriteTips.includes(action.payload.tipId)
          ? state.favoriteTips.filter((id) => id !== action.payload.tipId)
          : [...state.favoriteTips, action.payload.tipId],
      }

    // --- notes & quizzes ---
    case 'ADD_NOTES':
      return { ...state, notes: [action.payload, ...state.notes] }
    case 'DELETE_NOTES':
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload.id),
        quizzes: state.quizzes.filter((q) => q.notesId !== action.payload.id),
      }
    case 'ADD_QUIZ':
      return { ...state, quizzes: [action.payload, ...state.quizzes] }
    case 'DELETE_QUIZ':
      return { ...state, quizzes: state.quizzes.filter((q) => q.id !== action.payload.id) }
    case 'RECORD_QUIZ_ATTEMPT':
      return {
        ...state,
        quizzes: state.quizzes.map((q) =>
          q.id === action.payload.quizId
            ? { ...q, attempts: [...(q.attempts || []), action.payload.attempt] }
            : q,
        ),
      }

    // --- documents (My Burrow) ---
    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.payload, ...state.documents] }
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((d) => (d.id === action.payload.id ? { ...d, ...action.payload } : d)),
      }
    case 'DELETE_DOCUMENT':
      return { ...state, documents: state.documents.filter((d) => d.id !== action.payload.id) }
    case 'CLEAR_DOCUMENTS':
      return { ...state, documents: [] }
    case 'LINK_NOTES_TO_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.payload.docId
            ? {
                ...d,
                status: d.status === 'new' ? 'in-progress' : d.status,
                linkedNotesIds: [...new Set([...(d.linkedNotesIds || []), action.payload.notesId])],
              }
            : d,
        ),
      }

    // --- habits ---
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, { id: uid(), createdAt: todayKey(), log: {}, ...action.payload }] }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload.id) }
    case 'TOGGLE_HABIT_DAY': {
      const { habitId, day } = action.payload
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== habitId) return h
          const log = { ...h.log }
          if (log[day]) delete log[day]
          else log[day] = true
          return { ...h, log }
        }),
      }
    }

    // --- timer ---
    case 'LOG_TIMER_SESSION':
      return { ...state, timerSessions: [...state.timerSessions, action.payload] }
    case 'UPDATE_TIMER':
      return { ...state, timer: { ...state.timer, ...action.payload } }

    // --- chat ---
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] }
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] }

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
