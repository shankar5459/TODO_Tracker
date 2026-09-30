import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Todo } from '../types'

type Props = {
  todo: Todo
  onToggle: (id: string) => void
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, trimmed)
    } else {
      setDraft(todo.text)
    }
    setEditing(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    commit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setDraft(todo.text)
      setEditing(false)
    }
  }

  return (
    <li className={`todo-item${todo.completed ? ' is-done' : ''}`}>
      <label className="todo-check">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        />
        <span className="checkbox-face" aria-hidden="true" />
      </label>

      {editing ? (
        <form className="todo-edit" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="todo-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
        </form>
      ) : (
        <button
          type="button"
          className="todo-text"
          onDoubleClick={() => setEditing(true)}
          onClick={() => setEditing(true)}
        >
          {todo.text}
        </button>
      )}

      <button
        type="button"
        className="btn btn-ghost todo-delete"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.text}`}
      >
        Delete
      </button>
    </li>
  )
}
