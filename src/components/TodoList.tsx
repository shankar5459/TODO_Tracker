import type { Filter, Todo } from '../types'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  filter: Filter
  onFilterChange: (filter: Filter) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClearCompleted: () => void
  completedCount: number
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
]

export function TodoList({
  todos,
  filter,
  onFilterChange,
  onToggle,
  onUpdate,
  onDelete,
  onClearCompleted,
  completedCount,
}: Props) {
  return (
    <section className="todo-list-panel" aria-label="Tasks">
      <div className="list-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`filter-tab${filter === f.id ? ' is-active' : ''}`}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {completedCount > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onClearCompleted}>
            Clear done
          </button>
        )}
      </div>

      {todos.length === 0 ? (
        <p className="empty-state">
          {filter === 'all'
            ? 'No tasks yet. Add one above.'
            : filter === 'active'
              ? 'Nothing active — nice work.'
              : 'No completed tasks yet.'}
        </p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
