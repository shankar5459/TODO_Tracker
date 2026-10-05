import { toDayKey } from './dates'
import type { HistoryEntry, Todo } from './types'
import { todoToHistoryEntry } from './storage'

function upsertHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const without = history.filter((h) => h.id !== entry.id)
  return [entry, ...without].sort((a, b) => b.completedAt - a.completedAt)
}

/**
 * - Incomplete tasks from earlier days roll into today.
 * - Completed tasks from earlier days leave Today and stay in History.
 */
export function rolloverDay(
  todos: Todo[],
  history: HistoryEntry[],
  todayKey: string = toDayKey(),
): { todos: Todo[]; history: HistoryEntry[] } {
  let nextHistory = history
  const nextTodos: Todo[] = []

  for (const todo of todos) {
    if (todo.completed) {
      const completedDay = todo.completedAt ? toDayKey(todo.completedAt) : todo.dayKey
      nextHistory = upsertHistory(
        nextHistory,
        todoToHistoryEntry(todo, todo.completedAt ?? Date.now()),
      )
      // Keep only completions from today on the Today list.
      if (completedDay === todayKey) {
        nextTodos.push({ ...todo, dayKey: todayKey })
      }
      continue
    }

    if (todo.dayKey !== todayKey) {
      nextTodos.push({
        ...todo,
        dayKey: todayKey,
        carriedFrom: todo.carriedFrom ?? todo.dayKey,
      })
    } else {
      nextTodos.push(todo)
    }
  }

  return { todos: nextTodos, history: nextHistory }
}

export { upsertHistory }
