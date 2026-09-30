import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadTodos, saveTodos } from '../storage'
import type { Filter, Todo } from '../types'

function createId(): string {
  return crypto.randomUUID()
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos())
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos((prev) => [
      { id: createId(), text: trimmed, completed: false, createdAt: Date.now() },
      ...prev,
    ])
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }, [])

  const updateTodo = useCallback((id: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed))
  }, [])

  const incompleteCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  )

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed)
      case 'done':
        return todos.filter((t) => t.completed)
      default:
        return todos
    }
  }, [todos, filter])

  return {
    todos,
    filteredTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    incompleteCount,
  }
}
