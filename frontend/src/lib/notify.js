// Best-effort study reminders. This is a pure front-end PWA with no server,
// so it can only notify while the app is open (or backgrounded but not
// fully closed) in a browser that has granted permission — there's no push
// server able to wake a closed app. In practice that means: every time you
// open the app, it checks today's calendar events and exam countdowns and
// shows an in-app banner if something's due — that always works. Granting
// browser notification permission adds a real pop-up too, handy if you keep
// the app open in a background tab.

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function fireNotification(title, body, tag) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag })
  } catch {
    // some browsers (esp. on tablets) restrict Notification() outside a
    // service worker — the in-app banner still covers the reminder
  }
}
