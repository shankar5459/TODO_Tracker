import { useMemo, useState } from 'react'
import { formatDayKey, toDayKey } from '../dates'
import {
  priorityLabel,
  type HistoryEntry,
  type HistoryRange,
  type Priority,
} from '../types'

type Props = {
  history: HistoryEntry[]
  onDelete: (id: string) => void
}

const RANGES: { id: HistoryRange; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '6m', label: '6 months' },
  { id: '1y', label: '1 year' },
  { id: 'all', label: 'All' },
]

function rangeStart(range: HistoryRange, now: number): number | null {
  const day = 24 * 60 * 60 * 1000
  switch (range) {
    case '7d':
      return now - 7 * day
    case '30d':
      return now - 30 * day
    case '6m':
      return now - 182 * day
    case '1y':
      return now - 365 * day
    case 'all':
      return null
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function HistoryPanel({ history, onDelete }: Props) {
  const [range, setRange] = useState<HistoryRange>('6m')
  const [query, setQuery] = useState('')
  const [selectedDay, setSelectedDay] = useState('')

  const availableDays = useMemo(() => {
    const keys = new Set(history.map((h) => h.dayKey || toDayKey(h.completedAt)))
    return [...keys].sort((a, b) => b.localeCompare(a))
  }, [history])

  const filtered = useMemo(() => {
    const start = rangeStart(range, Date.now())
    const q = query.trim().toLowerCase()

    return history
      .filter((h) => {
        const day = h.dayKey || toDayKey(h.completedAt)
        if (selectedDay) return day === selectedDay
        if (start != null && h.completedAt < start) return false
        return true
      })
      .filter((h) => (q ? h.text.toLowerCase().includes(q) : true))
      .sort((a, b) => b.completedAt - a.completedAt)
  }, [history, range, query, selectedDay])

  const stats = useMemo(() => {
    const counts: Record<Priority, number> = { high: 0, medium: 0, low: 0 }
    for (const entry of filtered) {
      counts[entry.priority] += 1
    }
    return counts
  }, [filtered])

  const groups = useMemo(() => {
    const map = new Map<string, { dayKey: string; label: string; items: HistoryEntry[] }>()
    for (const entry of filtered) {
      const key = entry.dayKey || toDayKey(entry.completedAt)
      const existing = map.get(key)
      if (existing) {
        existing.items.push(entry)
      } else {
        map.set(key, { dayKey: key, label: formatDayKey(key), items: [entry] })
      }
    }
    return [...map.values()]
  }, [filtered])

  function clearDayFilter() {
    setSelectedDay('')
  }

  return (
    <section className="history-panel" aria-label="Completed work history">
      <div className="history-header">
        <div>
          <h2>History</h2>
          <p className="history-copy">
            Completed work is stored by date. Search or pick a day to review what you finished.
          </p>
        </div>
      </div>

      <div className="history-tools">
        <label className="history-search">
          <span className="sr-only">Search history</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search completed tasks…"
          />
        </label>

        <label className="history-date">
          <span>Day</span>
          <input
            type="date"
            value={selectedDay}
            max={toDayKey()}
            onChange={(e) => setSelectedDay(e.target.value)}
          />
        </label>

        {selectedDay && (
          <button type="button" className="btn btn-ghost" onClick={clearDayFilter}>
            Clear day
          </button>
        )}
      </div>

      {availableDays.length > 0 && (
        <div className="history-day-chips" aria-label="Jump to a day">
          {availableDays.slice(0, 12).map((day) => (
            <button
              key={day}
              type="button"
              className={`day-chip${selectedDay === day ? ' is-active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {formatDayKey(day)}
            </button>
          ))}
        </div>
      )}

      {!selectedDay && (
        <div className="filter-tabs history-ranges" role="tablist" aria-label="History range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              className={`filter-tab${range === r.id ? ' is-active' : ''}`}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="history-stats" aria-label="Summary">
        <div className="stat-card">
          <span className="stat-value">{filtered.length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.high}</span>
          <span className="stat-label">High</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.medium}</span>
          <span className="stat-label">Medium</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.low}</span>
          <span className="stat-label">Low</span>
        </div>
      </div>

      {selectedDay && (
        <p className="history-selected-day">
          Showing {formatDayKey(selectedDay)}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="empty-state">
          {selectedDay
            ? 'No completed tasks on this day.'
            : query
              ? 'No completed tasks match that search.'
              : 'No completed tasks in this range yet.'}
        </p>
      ) : (
        <div className="history-groups">
          {groups.map((group) => (
            <section key={group.dayKey} className="history-day">
              <h3>
                <button
                  type="button"
                  className="history-day-link"
                  onClick={() => setSelectedDay(group.dayKey)}
                >
                  {group.label}
                </button>
              </h3>
              <ul className="history-list">
                {group.items.map((entry) => (
                  <li key={entry.id} className="history-item">
                    <span
                      className={`priority-dot priority-${entry.priority}`}
                      title={priorityLabel(entry.priority)}
                    />
                    <div className="history-item-main">
                      <p className="history-item-text">{entry.text}</p>
                      <p className="history-item-meta">
                        {priorityLabel(entry.priority)} · {formatTime(entry.completedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onDelete(entry.id)}
                      aria-label={`Remove ${entry.text} from history`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
