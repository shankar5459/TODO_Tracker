import { DEFAULT_SETTINGS, type Settings, type Todo } from './types'

const TODOS_KEY = 'todo-tracker:todos'
const SETTINGS_KEY = 'todo-tracker:settings'

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') return false
  const t = value as Todo
  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.createdAt === 'number'
  )
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTodo)
  } catch {
    return []
  }
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    const interval = parsed.intervalMinutes
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : DEFAULT_SETTINGS.notificationsEnabled,
      intervalMinutes: interval === 15 || interval === 30 || interval === 60 ? interval : DEFAULT_SETTINGS.intervalMinutes,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
