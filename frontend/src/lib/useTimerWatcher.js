import { useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { todayKey } from './utils.js'

const COMPLETION_COPY = {
  work: {
    title: '🐰 Focus session complete!',
    body: "Nice work — you earned a break. Hop over and stretch your legs.",
    toastEmoji: '🐰',
  },
  short: {
    title: '🌈 Break’s over!',
    body: 'Ready to get back to studying?',
    toastEmoji: '🌈',
  },
  long: {
    title: '🥕 Long break’s over!',
    body: 'Ready to get back to studying?',
    toastEmoji: '🥕',
  },
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    osc.frequency.value = 660
    osc.connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close()
    }, 250)
  } catch {
    // audio unavailable (e.g. tab backgrounded/not user-activated) — skip silently
  }
}

function notifyOS(copy) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(copy.title, {
      body: copy.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'burrow-timer',
    })
  } catch {
    // some browsers (notably ones without an installed SW context) can throw — ignore
  }
}

// Mounted once at the app root, independent of which sidebar tab is open, so
// a running timer is detected and completed even while the Timer page itself
// is unmounted. endTime is an absolute timestamp, so background tab
// throttling can only delay *when* this notices, never make it miss or drift.
export function useTimerWatcher() {
  const { state, dispatch } = useStore()
  const { running, endTime, mode, minutes, moduleId } = state.timer

  useEffect(() => {
    if (!running || !endTime) return undefined

    let fired = false
    function check() {
      if (fired || Date.now() < endTime) return
      fired = true

      dispatch({ type: 'UPDATE_TIMER', payload: { running: false, endTime: null, pausedRemainingSeconds: null } })
      if (mode === 'work') {
        dispatch({ type: 'LOG_TIMER_SESSION', payload: { date: todayKey(), minutes, moduleId } })
      }
      const copy = COMPLETION_COPY[mode] || COMPLETION_COPY.work
      dispatch({
        type: 'SHOW_TOAST',
        payload: { id: Date.now(), emoji: copy.toastEmoji, title: copy.title, body: copy.body },
      })
      notifyOS(copy)
      playChime()
    }

    check() // covers "the endTime already passed while this effect was unmounted"
    const interval = setInterval(check, 1000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [running, endTime, mode, minutes, moduleId, dispatch])
}
