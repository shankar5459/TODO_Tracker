import { useState, type FormEvent } from 'react'
import { PRIORITIES, priorityLabel, type Priority } from '../types'

type Props = {
  onAdd: (text: string, priority: Priority) => void
}

export function TodoForm({ onAdd }: Props) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd(text, priority)
    setText('')
    setPriority('medium')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">
        New task
      </label>
      <input
        id="new-todo"
        className="todo-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs doing?"
        autoComplete="off"
      />
      <label className="sr-only" htmlFor="new-priority">
        Priority
      </label>
      <select
        id="new-priority"
        className="priority-select"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {priorityLabel(p)}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
