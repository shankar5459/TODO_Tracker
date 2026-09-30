import { useState, type FormEvent } from 'react'

type Props = {
  onAdd: (text: string) => void
}

export function TodoForm({ onAdd }: Props) {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd(text)
    setText('')
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
      <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
