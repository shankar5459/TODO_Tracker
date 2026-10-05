import type { IntervalMinutes, Settings } from '../types'
import type { NotificationPermissionState } from '../notifications'

type Props = {
  settings: Settings
  remindersActive: boolean
  lastRemindedAt: number | null
  notificationPermission: NotificationPermissionState
  toastMessage: string | null
  onDismissToast: () => void
  onUpdateSettings: (patch: Partial<Settings>) => void
  onIntervalChange: (minutes: IntervalMinutes) => void
  onTest: () => void
}

const INTERVALS: IntervalMinutes[] = [15, 30, 60]

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function permissionHint(permission: NotificationPermissionState, enabled: boolean): string | null {
  if (permission === 'unsupported') {
    return 'This browser does not support notifications.'
  }
  if (permission === 'denied') {
    return 'Blocked by the browser. Open site settings for this page and allow notifications, then toggle this on again.'
  }
  if (enabled && permission === 'granted') {
    return 'Allowed. Each reminder uses a fresh alert. If the tab is focused, also watch the in-app Reminder banner at the top.'
  }
  if (!enabled && permission === 'granted') {
    return 'Permission is allowed. Turn the toggle on to use notifications.'
  }
  return 'Turning this on will ask your browser for permission.'
}

export function ReminderSettings({
  settings,
  remindersActive,
  lastRemindedAt,
  notificationPermission,
  toastMessage,
  onDismissToast,
  onUpdateSettings,
  onIntervalChange,
  onTest,
}: Props) {
  const hint = permissionHint(notificationPermission, settings.notificationsEnabled)

  return (
    <section className="reminder-panel" aria-label="Reminders">
      <div className="reminder-header">
        <h2>Reminders</h2>
        <span className={`status-pill${remindersActive ? ' is-on' : ''}`}>
          {remindersActive ? 'Active while tab is open' : 'Off'}
        </span>
      </div>

      <p className="reminder-copy">
        While this tab stays open, you get a nudge when open tasks remain.
      </p>

      <div className="reminder-controls">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
          />
          <span>Sound</span>
        </label>

        <div className="toggle-block">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
            />
            <span>Browser notifications</span>
          </label>
          {hint && <p className="permission-hint">{hint}</p>}
        </div>

        <div className="interval-row">
          <span className="interval-label" id="interval-label">
            Every
          </span>
          <div className="interval-options" role="group" aria-labelledby="interval-label">
            {INTERVALS.map((m) => (
              <button
                key={m}
                type="button"
                className={`interval-btn${settings.intervalMinutes === m ? ' is-active' : ''}`}
                onClick={() => onIntervalChange(m)}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="reminder-footer">
        <button type="button" className="btn btn-secondary" onClick={onTest}>
          Test reminder
        </button>
        <p className="last-reminded">
          {lastRemindedAt
            ? `Last reminder: ${formatTime(lastRemindedAt)}`
            : 'No reminder fired yet this session'}
        </p>
      </div>

      {toastMessage && (
        <div className="reminder-toast" role="status">
          <p>{toastMessage}</p>
          <button type="button" className="btn btn-ghost" onClick={onDismissToast} aria-label="Dismiss">
            Dismiss
          </button>
        </div>
      )}
    </section>
  )
}
