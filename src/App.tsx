import { useState } from 'react'
import { formatDayKey } from './dates'
import { HistoryPanel } from './components/HistoryPanel'
import { ReminderSettings } from './components/ReminderSettings'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useReminder } from './hooks/useReminder'
import { useTodos } from './hooks/useTodos'
import type { AppView } from './types'

export default function App() {
  const [view, setView] = useState<AppView>('today')
  const {
    todos,
    history,
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
  } = useTodos()

  const {
    settings,
    updateSettings,
    setIntervalMinutes,
    testReminder,
    lastRemindedAt,
    remindersActive,
    notificationPermission,
    toastMessage,
    bannerMessage,
    dismissToast,
    dismissBanner,
  } = useReminder(incompleteCount, incompleteTitles)

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden="true" />
      <main className="app">
        {bannerMessage && (
          <div className="reminder-banner" role="alert">
            <div>
              <strong>Reminder</strong>
              <p>{bannerMessage}</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={dismissBanner}>
              Dismiss
            </button>
          </div>
        )}

        <header className="app-header">
          <div>
            <p className="brand">Todo Tracker</p>
            <h1>
              {view === 'history'
                ? 'Work history'
                : incompleteCount === 0
                  ? 'All clear for today'
                  : incompleteCount === 1
                    ? '1 open task today'
                    : `${incompleteCount} open tasks today`}
            </h1>
            {view === 'today' && (
              <p className="day-subtitle">{formatDayKey(todayKey)}</p>
            )}
          </div>
          <div className="view-tabs" role="tablist" aria-label="App view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'today'}
              className={`view-tab${view === 'today' ? ' is-active' : ''}`}
              onClick={() => setView('today')}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'history'}
              className={`view-tab${view === 'history' ? ' is-active' : ''}`}
              onClick={() => setView('history')}
            >
              History
              {history.length > 0 && <span className="view-count">{history.length}</span>}
            </button>
          </div>
        </header>

        {view === 'today' ? (
          <>
            <TodoForm onAdd={addTodo} />

            <TodoList
              todos={filteredTodos}
              filter={filter}
              onFilterChange={setFilter}
              onToggle={toggleTodo}
              onUpdate={updateTodo}
              onPriorityChange={setPriority}
              onDelete={deleteTodo}
              onClearCompleted={clearCompleted}
              completedCount={completedCount}
              carriedCount={carriedCount}
            />

            <ReminderSettings
              settings={settings}
              remindersActive={remindersActive}
              lastRemindedAt={lastRemindedAt}
              notificationPermission={notificationPermission}
              toastMessage={toastMessage}
              onDismissToast={dismissToast}
              onUpdateSettings={(patch) => void updateSettings(patch)}
              onIntervalChange={setIntervalMinutes}
              onTest={() => void testReminder()}
            />
          </>
        ) : (
          <HistoryPanel history={history} onDelete={deleteHistoryEntry} />
        )}
      </main>
    </div>
  )
}
