import { useCallback, useEffect, useMemo, useState } from 'react'
import { toDayKey } from '../dates'
import { upsertHistory, rolloverDay } from '../rollover'
import {
  loadHistory,
  loadTodos,
  saveHistory,
  saveTodos,
  todoToHistoryEntry,
} from '../storage'
import type { Filter, HistoryEntry, Priority, Todo } from '../types'

function createId(): string {
  return crypto.randomUUID()
}

function seedHistory(todos: Todo[], history: HistoryEntry[]): HistoryEntry[] {
  const existing = new Set(history.map((h) => h.id))
  let next = history
  for (const todo of todos) {
    if (!todo.completed || existing.has(todo.id)) continue
    next = upsertHistory(next, todoToHistoryEntry(todo, todo.completedAt ?? todo.createdAt))
  }
  return next
}

type State = {
  todos: Todo[]
  history: HistoryEntry[]
}

export function useTodos() {
  const [todayKey, setTodayKey] = useState(() => toDayKey())
  const [state, setState] = useState<State>(() => {
    const today = toDayKey()
    const seededHistory = seedHistory(loadTodos(), loadHistory())
    return rolloverDay(loadTodos(), seededHistory, today)
  })
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    saveTodos(state.todos)
  }, [state.todos])

  useEffect(() => {
    saveHistory(state.history)
  }, [state.history])

  // Roll forward when the calendar day changes or the tab becomes visible again.
  useEffect(() => {
    const syncDay = () => {
      const nextKey = toDayKey()
      setTodayKey((prev) => (prev === nextKey ? prev : nextKey))
      setState((statePrev) => rolloverDay(statePrev.todos, statePrev.history, nextKey))
    }

    const id = window.setInterval(syncDay, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncDay()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', syncDay)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', syncDay)
    }
  }, [])

  const addTodo = useCallback((text: string, priority: Priority = 'medium') => {
    const trimmed = text.trim()
    if (!trimmed) return
    const dayKey = toDayKey()
    setState((prev) => ({
      ...prev,
      todos: [
        {
          id: createId(),
          text: trimmed,
          completed: false,
          priority,
          dayKey,
          carriedFrom: null,
          createdAt: Date.now(),
          completedAt: null,
        },
        ...prev.todos,
      ],
    }))
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.todos.find((t) => t.id === id)
      if (!target) return prev

      const completing = !target.completed
      const completedAt = completing ? Date.now() : null
      const todos = prev.todos.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: completing,
              completedAt,
              dayKey: completing ? toDayKey(completedAt!) : t.dayKey,
            }
          : t,
      )

      const history = completing
        ? upsertHistory(prev.history, todoToHistoryEntry({ ...target, dayKey: toDayKey(completedAt!) }, completedAt!))
        : prev.history.filter((entry) => entry.id !== id)

      return { todos, history }
    })
  }, [])

  const updateTodo = useCallback((id: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setState((prev) => ({
      todos: prev.todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
      history: prev.history.some((h) => h.id === id)
        ? upsertHistory(prev.history, {
            ...prev.history.find((h) => h.id === id)!,
            text: trimmed,
          })
        : prev.history,
    }))
  }, [])

  const setPriority = useCallback((id: string, priority: Priority) => {
    setState((prev) => ({
      todos: prev.todos.map((t) => (t.id === id ? { ...t, priority } : t)),
      history: prev.history.some((h) => h.id === id)
        ? upsertHistory(prev.history, {
            ...prev.history.find((h) => h.id === id)!,
            priority,
          })
        : prev.history,
    }))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.todos.find((t) => t.id === id)
      return {
        todos: prev.todos.filter((t) => t.id !== id),
        history:
          target && !target.completed
            ? prev.history.filter((entry) => entry.id !== id)
            : prev.history,
      }
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setState((prev) => {
      const done = prev.todos.filter((t) => t.completed)
      let history = prev.history
      for (const todo of done) {
        history = upsertHistory(history, todoToHistoryEntry(todo, todo.completedAt ?? Date.now()))
      }
      return {
        todos: prev.todos.filter((t) => !t.completed),
        history,
      }
    })
  }, [])

  const deleteHistoryEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }))
  }, [])

  const todayTodos = useMemo(
    () => state.todos.filter((t) => t.dayKey === todayKey || !t.completed),
    [state.todos, todayKey],
  )

  const incompleteCount = useMemo(
    () => todayTodos.filter((t) => !t.completed).length,
    [todayTodos],
  )

  const incompleteTitles = useMemo(
    () => todayTodos.filter((t) => !t.completed).map((t) => t.text),
    [todayTodos],
  )

  const filteredTodos = useMemo(() => {
    const sorted = [...todayTodos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const order = { high: 0, medium: 1, low: 2 } as const
      if (!a.completed && !b.completed && a.priority !== b.priority) {
        return order[a.priority] - order[b.priority]
      }
      return b.createdAt - a.createdAt
    })

    switch (filter) {
      case 'active':
        return sorted.filter((t) => !t.completed)
      case 'done':
        return sorted.filter((t) => t.completed)
      default:
        return sorted
    }
  }, [todayTodos, filter])

  const carriedCount = useMemo(
    () => todayTodos.filter((t) => !t.completed && t.carriedFrom).length,
    [todayTodos],
  )

  return {
    todos: todayTodos,
    history: state.history,
    filteredTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    updateTodo,
    setPriority,
    deleteTodo,
    clearCompleted,
    deleteHistoryEntry,
    incompleteCount,
    incompleteTitles,
    todayKey,
    carriedCount,
  }
}
