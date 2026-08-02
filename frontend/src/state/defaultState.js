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
  }
}
