import { useState } from 'react'
import { formatDayKey } from './dates'
import { AuthGate } from './components/AuthGate'
import { HistoryPanel } from './components/HistoryPanel'
import { ReminderSettings } from './components/ReminderSettings'
import { SyncStatusChip } from './components/SyncStatusChip'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useAuth } from './hooks/useAuth'
import { useReminder } from './hooks/useReminder'
import { useTodos } from './hooks/useTodos'
import type { AppView } from './types'

function SignedInApp({
  uid,
  email,
  onSignOut,
}: {
  uid: string
  email: string | null
  onSignOut: () => void
}) {
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
    hydrated,
    syncStatus,
    syncError,
  } = useTodos(uid)

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
  } = useReminder(uid, incompleteCount, incompleteTitles)

  const completedCount = todos.filter((t) => t.completed).length

  if (!hydrated) {
    return (
      <section className="auth-panel">
        <p className="brand">Todo Tracker</p>
        <h1>Loading your tasks…</h1>
        <p className="auth-copy">Syncing with the cloud.</p>
      </section>
    )
  }

  return (
    <>
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
          {view === 'today' && <p className="day-subtitle">{formatDayKey(todayKey)}</p>}
        </div>
        <div className="header-actions">
          <SyncStatusChip status={syncStatus} error={syncError} />
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
        </div>
      </header>

      <div className="user-bar">
        <span className="user-email">{email || 'Signed in'}</span>
        <button type="button" className="btn btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>

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
    </>
  )
}

export default function App() {
  const { user, loading, migrating, ready, error, signingIn, signIn, signOut } = useAuth()

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden="true" />
      <main className="app">
        {loading || migrating || (user && !ready) ? (
          <section className="auth-panel">
            <p className="brand">Todo Tracker</p>
            <h1>{migrating ? 'Importing local data…' : 'Loading…'}</h1>
            <p className="auth-copy">
              {migrating
                ? 'Moving your existing browser tasks into the cloud for the first time.'
                : 'Checking your Google session.'}
            </p>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
          </section>
        ) : !user ? (
          <AuthGate signingIn={signingIn} error={error} onSignIn={() => void signIn()} />
        ) : (
          <SignedInApp uid={user.uid} email={user.email} onSignOut={() => void signOut()} />
        )}
      </main>
    </div>
  )
}
