// Best-effort shopping-day reminders. This is a pure front-end PWA with no
// server, so it can only notify while the app is open (or backgrounded but
// not fully closed) in a browser that has granted permission — there's no
// push server sending it a wake-up when the app/tablet is closed. It's
// still useful as a "you opened the app today, don't forget the list"
// nudge, which is what gets checked on every app load.

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

export function fireShoppingNotification(list) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(`🛒 Shopping day: ${list.name}`, {
      body: `You planned to shop today — ${list.items.length} item${list.items.length === 1 ? '' : 's'} on your list. Don't forget it!`,
      tag: `shopping-${list.id}`,
    })
  } catch {
    // some browsers (esp. on tablets) restrict Notification() outside a
    // service worker — the in-app banner still covers the reminder
  }
}
