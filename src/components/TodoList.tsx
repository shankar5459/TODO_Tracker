import type { Filter, Priority, Todo } from '../types'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  filter: Filter
  onFilterChange: (filter: Filter) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, text: string) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onClearCompleted: () => void
  completedCount: number
  carriedCount: number
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
  onPriorityChange,
  onDelete,
  onClearCompleted,
  completedCount,
  carriedCount,
}: Props) {
  return (
    <section className="todo-list-panel" aria-label="Today's tasks">
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
            Archive done
          </button>
        )}
      </div>

      {carriedCount > 0 && (
        <p className="rollover-note">
          {carriedCount === 1
            ? '1 unfinished task was moved into today from an earlier day.'
            : `${carriedCount} unfinished tasks were moved into today from earlier days.`}
        </p>
      )}

      {todos.length === 0 ? (
        <p className="empty-state">
          {filter === 'all'
            ? 'No tasks for today yet. Add one above.'
            : filter === 'active'
              ? 'Nothing active — nice work.'
              : 'Nothing completed today yet. Older completions are in History.'}
        </p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onPriorityChange={onPriorityChange}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
