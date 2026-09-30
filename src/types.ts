export type Todo = {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

export type Filter = 'all' | 'active' | 'done'

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
