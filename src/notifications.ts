export type NotificationPermissionState = NotificationPermission | 'unsupported'

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/** Must be called directly from a user gesture (no awaits beforehand). */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function buildBody(incompleteTitles: string[]): string {
  if (incompleteTitles.length === 0) {
    return 'Time to check your to-do list.'
  }
  if (incompleteTitles.length === 1) {
    return `Still open: ${incompleteTitles[0]}`
  }
  const preview = incompleteTitles.slice(0, 3).join(' · ')
  const more =
    incompleteTitles.length > 3 ? ` (+${incompleteTitles.length - 3} more)` : ''
  return `${incompleteTitles.length} open: ${preview}${more}`
}

/**
 * Unique tag each time so macOS/Chrome do not silently replace/suppress
 * the previous reminder notification.
 */
export async function showReminderNotification(incompleteTitles: string[]): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const title =
    incompleteTitles.length === 1
      ? '1 open task'
      : `${Math.max(incompleteTitles.length, 1)} open tasks`
  const body = buildBody(incompleteTitles)
  const tag = `todo-tracker-reminder-${Date.now()}`

  const options = {
    body,
    tag,
    requireInteraction: true,
    silent: false,
  } as NotificationOptions

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, options)
        return true
      }
    }
  } catch {
    // Fall through to the constructor path.
  }

  try {
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    // Auto-close after a while so the tray does not fill up, but keep it long enough to notice.
    window.setTimeout(() => notification.close(), 20_000)
    return true
  } catch {
    return false
  }
}

export { buildBody }
