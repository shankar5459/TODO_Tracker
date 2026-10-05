export type Priority = 'high' | 'medium' | 'low'

export type Todo = {
  id: string
  text: string
  completed: boolean
  priority: Priority
  /** Calendar day this task belongs to (YYYY-MM-DD). */
  dayKey: string
  /** Previous dayKey if this task was rolled forward as still pending. */
  carriedFrom: string | null
  createdAt: number
  completedAt: number | null
}

/** Immutable record of finished work for long-term review. */
export type HistoryEntry = {
  id: string
  text: string
  priority: Priority
  createdAt: number
  completedAt: number
  dayKey: string
}

export type Filter = 'all' | 'active' | 'done'

export type AppView = 'today' | 'history'

export type HistoryRange = '7d' | '30d' | '6m' | '1y' | 'all'

export type IntervalMinutes = 15 | 30 | 60

export type Settings = {
  soundEnabled: boolean
  notificationsEnabled: boolean
  intervalMinutes: IntervalMinutes
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  notificationsEnabled: false,
  intervalMinutes: 60,
}

export const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export function priorityLabel(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
  }
}
