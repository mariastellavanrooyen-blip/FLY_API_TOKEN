import { todayKey, DEFAULT_METHODS } from '../lib/utils.js'

export const STORAGE_KEY = 'examready_state_v1'

export function makeDefaultState() {
  return {
    version: 1,
    settings: {
      appName: 'ExamReady',
      studentName: 'Me',
      weeklyGoalHours: 10,
      examReminderDays: [7, 3, 1, 0], // fire a countdown nudge at these days-out
    },
    // what you're studying
    subjects: [
      // { id, name, totalChapters, startDate: 'YYYY-MM-DD', targetDate: 'YYYY-MM-DD'|null, createdAt }
    ],
    // the chapter log — one row per study session
    chapterLogs: [
      // { id, subjectId, chapter, date, minutes, method: methodId, confidence: 1-5, completed, notes }
    ],
    // exam countdowns — date can be null while only a tentative month is known
    exams: [
      // { id, subjectId: id|null, title, date: 'YYYY-MM-DD'|null, tentativeMonth: 'October'|null, notes }
    ],
    // adjustable calendar
    events: [
      // { id, date, time, title, type: 'study'|'exam'|'deadline'|'other', notify, notifiedOn }
    ],
    // study methods available to log against — built-ins plus any you add
    methods: DEFAULT_METHODS,
    createdAt: todayKey(),
    uiToast: null,
  }
}
