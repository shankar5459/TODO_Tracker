import { toDayKey } from './dates'
import { DEFAULT_SETTINGS, type HistoryEntry, type Priority, type Settings, type Todo } from './types'

const TODOS_KEY = 'todo-tracker:todos'
const HISTORY_KEY = 'todo-tracker:history'
const SETTINGS_KEY = 'todo-tracker:settings'

function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low'
}

function normalizeTodo(value: unknown): Todo | null {
  if (!value || typeof value !== 'object') return null
  const t = value as Record<string, unknown>
  if (typeof t.id !== 'string' || typeof t.text !== 'string' || typeof t.completed !== 'boolean') {
    return null
  }
  if (typeof t.createdAt !== 'number') return null

  const completedAt =
    typeof t.completedAt === 'number'
      ? t.completedAt
      : t.completed
        ? t.createdAt
        : null

  const dayKey =
    typeof t.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dayKey)
      ? t.dayKey
      : toDayKey(completedAt ?? t.createdAt)

  return {
    id: t.id,
    text: t.text,
    completed: t.completed,
    priority: isPriority(t.priority) ? t.priority : 'medium',
    dayKey,
    carriedFrom: typeof t.carriedFrom === 'string' ? t.carriedFrom : null,
    createdAt: t.createdAt,
    completedAt,
  }
}

function normalizeHistoryEntry(value: unknown): HistoryEntry | null {
  if (!value || typeof value !== 'object') return null
  const t = value as Record<string, unknown>
  if (
    typeof t.id !== 'string' ||
    typeof t.text !== 'string' ||
    typeof t.createdAt !== 'number' ||
    typeof t.completedAt !== 'number'
  ) {
    return null
  }
  const dayKey =
    typeof t.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dayKey)
      ? t.dayKey
      : toDayKey(t.completedAt)

  return {
    id: t.id,
    text: t.text,
    priority: isPriority(t.priority) ? t.priority : 'medium',
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    dayKey,
  }
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeTodo).filter((t): t is Todo => t !== null)
  } catch {
    return []
  }
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeHistoryEntry).filter((t): t is HistoryEntry => t !== null)
  } catch {
    return []
  }
}

export function saveHistory(history: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
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

export function todoToHistoryEntry(todo: Todo, completedAt: number): HistoryEntry {
  return {
    id: todo.id,
    text: todo.text,
    priority: todo.priority,
    createdAt: todo.createdAt,
    completedAt,
    dayKey: toDayKey(completedAt),
  }
}
