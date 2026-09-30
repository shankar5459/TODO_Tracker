import type { IntervalMinutes, Settings } from '../types'

type Props = {
  settings: Settings
  remindersActive: boolean
  lastRemindedAt: number | null
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

export function ReminderSettings({
  settings,
  remindersActive,
  lastRemindedAt,
  onUpdateSettings,
  onIntervalChange,
  onTest,
}: Props) {
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

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
          />
          <span>Browser notifications</span>
        </label>

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
    </section>
  )
}
