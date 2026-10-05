import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toDayKey } from '../dates'
import {
  removeHistoryEntry,
  removeTodo,
  replaceHistoryCloud,
  replaceTodosCloud,
  subscribeHistory,
  subscribeTodos,
  upsertHistoryEntry,
  upsertTodo,
  type SyncStatus,
} from '../firebase/sync'
import { todoToHistoryEntry } from '../storage'
import { upsertHistory, rolloverDay } from '../rollover'
import type { Filter, HistoryEntry, Priority, Todo } from '../types'

function createId(): string {
  return crypto.randomUUID()
}

type State = {
  todos: Todo[]
  history: HistoryEntry[]
}

function statesEqual(a: State, b: State): boolean {
  return JSON.stringify(a.todos) === JSON.stringify(b.todos) && JSON.stringify(a.history) === JSON.stringify(b.history)
}

export function useTodos(uid: string) {
  const [todayKey, setTodayKey] = useState(() => toDayKey())
  const [state, setState] = useState<State>({ todos: [], history: [] })
  const [filter, setFilter] = useState<Filter>('all')
  const [hydrated, setHydrated] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing')
  const [syncError, setSyncError] = useState<string | null>(null)

  const todosMeta = useRef({ fromCache: true, hasPendingWrites: false })
  const historyMeta = useRef({ fromCache: true, hasPendingWrites: false })
  const todosReady = useRef(false)
  const historyReady = useRef(false)
  const latest = useRef<State>({ todos: [], history: [] })
  const writing = useRef(false)

  const refreshStatus = useCallback(() => {
    if (syncError) {
      setSyncStatus('error')
      return
    }
    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }
    if (
      writing.current ||
      todosMeta.current.hasPendingWrites ||
      historyMeta.current.hasPendingWrites
    ) {
      setSyncStatus('syncing')
      return
    }
    setSyncStatus('synced')
  }, [syncError])

  useEffect(() => {
    const onOnline = () => {
      setSyncError(null)
      refreshStatus()
    }
    const onOffline = () => refreshStatus()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refreshStatus])

  const applyCloud = useCallback(async () => {
    if (!todosReady.current || !historyReady.current) return
    const today = toDayKey()
    const rolled = rolloverDay(latest.current.todos, latest.current.history, today)
    setTodayKey(today)
    setState(rolled)
    setHydrated(true)

    if (!statesEqual(latest.current, rolled)) {
      writing.current = true
      refreshStatus()
      try {
        await replaceTodosCloud(uid, rolled.todos)
        await replaceHistoryCloud(uid, rolled.history)
        latest.current = rolled
        setSyncError(null)
      } catch (err) {
        setSyncError((err as Error).message || 'Sync failed')
      } finally {
        writing.current = false
        refreshStatus()
      }
    } else {
      refreshStatus()
    }
  }, [uid, refreshStatus])

  useEffect(() => {
    todosReady.current = false
    historyReady.current = false
    setHydrated(false)
    setSyncStatus('syncing')

    const unsubTodos = subscribeTodos(
      uid,
      (todos, fromCache, hasPendingWrites) => {
        todosMeta.current = { fromCache, hasPendingWrites }
        latest.current = { ...latest.current, todos }
        todosReady.current = true
        void applyCloud()
      },
      (err) => {
        setSyncError(err.message)
        refreshStatus()
      },
    )

    const unsubHistory = subscribeHistory(
      uid,
      (history, fromCache, hasPendingWrites) => {
        historyMeta.current = { fromCache, hasPendingWrites }
        latest.current = { ...latest.current, history }
        historyReady.current = true
        void applyCloud()
      },
      (err) => {
        setSyncError(err.message)
        refreshStatus()
      },
    )

    return () => {
      unsubTodos()
      unsubHistory()
    }
  }, [uid, applyCloud, refreshStatus])

  useEffect(() => {
    const syncDay = () => {
      const nextKey = toDayKey()
      setTodayKey((prev) => (prev === nextKey ? prev : nextKey))
      setState((statePrev) => {
        const rolled = rolloverDay(statePrev.todos, statePrev.history, nextKey)
        if (!statesEqual(statePrev, rolled)) {
          latest.current = rolled
          writing.current = true
          refreshStatus()
          void (async () => {
            try {
              await replaceTodosCloud(uid, rolled.todos)
              await replaceHistoryCloud(uid, rolled.history)
              setSyncError(null)
            } catch (err) {
              setSyncError((err as Error).message || 'Sync failed')
            } finally {
              writing.current = false
              refreshStatus()
            }
          })()
        }
        return rolled
      })
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
  }, [uid, refreshStatus])

  const trackWrite = useCallback(
    async (promise: Promise<void>) => {
      writing.current = true
      refreshStatus()
      try {
        await promise
        setSyncError(null)
      } catch (err) {
        setSyncError((err as Error).message || 'Sync failed')
        throw err
      } finally {
        writing.current = false
        refreshStatus()
      }
    },
    [refreshStatus],
  )

  const addTodo = useCallback(
    (text: string, priority: Priority = 'medium') => {
      const trimmed = text.trim()
      if (!trimmed) return
      const todo: Todo = {
        id: createId(),
        text: trimmed,
        completed: false,
        priority,
        dayKey: toDayKey(),
        carriedFrom: null,
        createdAt: Date.now(),
        completedAt: null,
      }
      setState((prev) => {
        const next = { ...prev, todos: [todo, ...prev.todos] }
        latest.current = next
        return next
      })
      void trackWrite(upsertTodo(uid, todo))
    },
    [uid, trackWrite],
  )

  const toggleTodo = useCallback(
    (id: string) => {
      setState((prev) => {
        const target = prev.todos.find((t) => t.id === id)
        if (!target) return prev

        const completing = !target.completed
        const completedAt = completing ? Date.now() : null
        const updated: Todo = {
          ...target,
          completed: completing,
          completedAt,
          dayKey: completing ? toDayKey(completedAt!) : target.dayKey,
        }
        const todos = prev.todos.map((t) => (t.id === id ? updated : t))
        const history = completing
          ? upsertHistory(prev.history, todoToHistoryEntry(updated, completedAt!))
          : prev.history.filter((entry) => entry.id !== id)

        const next = { todos, history }
        latest.current = next

        void trackWrite(
          (async () => {
            await upsertTodo(uid, updated)
            if (completing) {
              await upsertHistoryEntry(uid, todoToHistoryEntry(updated, completedAt!))
            } else {
              await removeHistoryEntry(uid, id)
            }
          })(),
        )

        return next
      })
    },
    [uid, trackWrite],
  )

  const updateTodo = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setState((prev) => {
        const todos = prev.todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
        const updated = todos.find((t) => t.id === id)
        const history = prev.history.some((h) => h.id === id)
          ? upsertHistory(prev.history, { ...prev.history.find((h) => h.id === id)!, text: trimmed })
          : prev.history
        const next = { todos, history }
        latest.current = next
        if (updated) {
          void trackWrite(
            (async () => {
              await upsertTodo(uid, updated)
              const hist = history.find((h) => h.id === id)
              if (hist) await upsertHistoryEntry(uid, hist)
            })(),
          )
        }
        return next
      })
    },
    [uid, trackWrite],
  )

  const setPriority = useCallback(
    (id: string, priority: Priority) => {
      setState((prev) => {
        const todos = prev.todos.map((t) => (t.id === id ? { ...t, priority } : t))
        const updated = todos.find((t) => t.id === id)
        const history = prev.history.some((h) => h.id === id)
          ? upsertHistory(prev.history, { ...prev.history.find((h) => h.id === id)!, priority })
          : prev.history
        const next = { todos, history }
        latest.current = next
        if (updated) {
          void trackWrite(
            (async () => {
              await upsertTodo(uid, updated)
              const hist = history.find((h) => h.id === id)
              if (hist) await upsertHistoryEntry(uid, hist)
            })(),
          )
        }
        return next
      })
    },
    [uid, trackWrite],
  )

  const deleteTodo = useCallback(
    (id: string) => {
      setState((prev) => {
        const target = prev.todos.find((t) => t.id === id)
        const history =
          target && !target.completed
            ? prev.history.filter((entry) => entry.id !== id)
            : prev.history
        const next = {
          todos: prev.todos.filter((t) => t.id !== id),
          history,
        }
        latest.current = next
        void trackWrite(
          (async () => {
            await removeTodo(uid, id)
            if (target && !target.completed) {
              await removeHistoryEntry(uid, id)
            }
          })(),
        )
        return next
      })
    },
    [uid, trackWrite],
  )

  const clearCompleted = useCallback(() => {
    setState((prev) => {
      const done = prev.todos.filter((t) => t.completed)
      let history = prev.history
      for (const todo of done) {
        history = upsertHistory(history, todoToHistoryEntry(todo, todo.completedAt ?? Date.now()))
      }
      const next = {
        todos: prev.todos.filter((t) => !t.completed),
        history,
      }
      latest.current = next
      void trackWrite(
        (async () => {
          for (const todo of done) {
            await removeTodo(uid, todo.id)
            await upsertHistoryEntry(uid, todoToHistoryEntry(todo, todo.completedAt ?? Date.now()))
          }
        })(),
      )
      return next
    })
  }, [uid, trackWrite])

  const deleteHistoryEntry = useCallback(
    (id: string) => {
      setState((prev) => {
        const next = {
          ...prev,
          history: prev.history.filter((h) => h.id !== id),
        }
        latest.current = next
        void trackWrite(removeHistoryEntry(uid, id))
        return next
      })
    },
    [uid, trackWrite],
  )

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
    hydrated,
    syncStatus,
    syncError,
  }
}
