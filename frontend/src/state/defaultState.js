import { uid, todayKey } from '../lib/utils.js'

export const STORAGE_KEY = 'burrowbrief_state_v1'

export function makeDefaultState() {
  const moduleA = uid()
  const moduleB = uid()
  return {
    version: 1,
    settings: {
      displayName: 'Maria',
      aiMode: 'offline', // 'offline' | 'claude'
      backendUrl: '',
    },
    modules: [
      {
        id: moduleA,
        name: 'Professional Ethics',
        color: '#d97952',
        description: 'Rules of professional conduct, duties to clients, courts and colleagues.',
        chapters: [],
      },
      {
        id: moduleB,
        name: 'Notarial Practice',
        color: '#93ab7c',
        description: 'Deeds, formalities, registration and the practical work of a notary.',
        chapters: [],
      },
    ],
    assignments: [],
    goals: [],
    favoriteTips: [],
    notes: [],
    quizzes: [],
    documents: [],
    habits: [
      { id: uid(), name: 'Study 1 hour', createdAt: todayKey(), log: {} },
      { id: uid(), name: 'Review yesterday’s notes', createdAt: todayKey(), log: {} },
    ],
    timerSessions: [],
    chatHistory: [],
    // Lives in global state (not component state) on purpose: switching sidebar
    // tabs must not unmount-and-lose a running timer. endTime is an absolute
    // timestamp so backgrounding/throttling can't make it drift or "stop".
    timer: {
      mode: 'work', // 'work' | 'short' | 'long'
      minutes: 25,
      running: false,
      endTime: null, // ms epoch when the timer completes, while running
      pausedRemainingSeconds: null, // seconds left, while paused
      moduleId: moduleA,
    },
    uiToast: null,
  }
}
