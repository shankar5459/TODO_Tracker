import { ReminderSettings } from './components/ReminderSettings'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useReminder } from './hooks/useReminder'
import { useTodos } from './hooks/useTodos'

export default function App() {
  const {
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
  } = useTodos()

  const {
    settings,
    updateSettings,
    setIntervalMinutes,
    testReminder,
    lastRemindedAt,
    remindersActive,
  } = useReminder(incompleteCount)

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden="true" />
      <main className="app">
        <header className="app-header">
          <div>
            <p className="brand">Todo Tracker</p>
            <h1>
              {incompleteCount === 0
                ? 'All clear'
                : incompleteCount === 1
                  ? '1 open task'
                  : `${incompleteCount} open tasks`}
            </h1>
          </div>
        </header>

        <TodoForm onAdd={addTodo} />

        <TodoList
          todos={filteredTodos}
          filter={filter}
          onFilterChange={setFilter}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          onClearCompleted={clearCompleted}
          completedCount={completedCount}
        />

        <ReminderSettings
          settings={settings}
          remindersActive={remindersActive}
          lastRemindedAt={lastRemindedAt}
          onUpdateSettings={(patch) => void updateSettings(patch)}
          onIntervalChange={setIntervalMinutes}
          onTest={() => void testReminder()}
        />
      </main>
    </div>
  )
}
