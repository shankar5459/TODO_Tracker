import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { loadHistory, loadSettings, loadTodos } from '../storage'
import { DEFAULT_SETTINGS, type HistoryEntry, type Settings, type Todo } from '../types'
import { getDb } from './db'

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error'

function userTodosCol(uid: string) {
  return collection(getDb(), 'users', uid, 'todos')
}

function userHistoryCol(uid: string) {
  return collection(getDb(), 'users', uid, 'history')
}

function settingsDoc(uid: string) {
  return doc(getDb(), 'users', uid, 'meta', 'settings')
}

function migrationDoc(uid: string) {
  return doc(getDb(), 'users', uid, 'meta', 'migration')
}

function todoToDoc(todo: Todo) {
  return {
    text: todo.text,
    completed: todo.completed,
    priority: todo.priority,
    dayKey: todo.dayKey,
    carriedFrom: todo.carriedFrom,
    createdAt: todo.createdAt,
    completedAt: todo.completedAt,
  }
}

function historyToDoc(entry: HistoryEntry) {
  return {
    text: entry.text,
    priority: entry.priority,
    createdAt: entry.createdAt,
    completedAt: entry.completedAt,
    dayKey: entry.dayKey,
  }
}

function docToTodo(id: string, data: Record<string, unknown>): Todo | null {
  if (typeof data.text !== 'string' || typeof data.completed !== 'boolean') return null
  if (typeof data.createdAt !== 'number') return null
  const priority = data.priority
  return {
    id,
    text: data.text,
    completed: data.completed,
    priority: priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'medium',
    dayKey: typeof data.dayKey === 'string' ? data.dayKey : '',
    carriedFrom: typeof data.carriedFrom === 'string' ? data.carriedFrom : null,
    createdAt: data.createdAt,
    completedAt: typeof data.completedAt === 'number' ? data.completedAt : null,
  }
}

function docToHistory(id: string, data: Record<string, unknown>): HistoryEntry | null {
  if (
    typeof data.text !== 'string' ||
    typeof data.createdAt !== 'number' ||
    typeof data.completedAt !== 'number'
  ) {
    return null
  }
  const priority = data.priority
  return {
    id,
    text: data.text,
    priority: priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'medium',
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    dayKey: typeof data.dayKey === 'string' ? data.dayKey : '',
  }
}

export async function upsertTodo(uid: string, todo: Todo): Promise<void> {
  await setDoc(doc(userTodosCol(uid), todo.id), todoToDoc(todo), { merge: true })
}

export async function removeTodo(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(userTodosCol(uid), id))
}

export async function upsertHistoryEntry(uid: string, entry: HistoryEntry): Promise<void> {
  await setDoc(doc(userHistoryCol(uid), entry.id), historyToDoc(entry), { merge: true })
}

export async function removeHistoryEntry(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(userHistoryCol(uid), id))
}

export async function saveCloudSettings(uid: string, settings: Settings): Promise<void> {
  await setDoc(settingsDoc(uid), settings, { merge: true })
}

export async function loadCloudSettings(uid: string): Promise<Settings> {
  const snap = await getDoc(settingsDoc(uid))
  if (!snap.exists()) return { ...DEFAULT_SETTINGS }
  const data = snap.data() as Partial<Settings>
  const interval = data.intervalMinutes
  return {
    soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    notificationsEnabled:
      typeof data.notificationsEnabled === 'boolean'
        ? data.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
    intervalMinutes:
      interval === 15 || interval === 30 || interval === 60 ? interval : DEFAULT_SETTINGS.intervalMinutes,
  }
}

export function subscribeTodos(
  uid: string,
  onData: (todos: Todo[], fromCache: boolean, hasPendingWrites: boolean) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userTodosCol(uid),
    { includeMetadataChanges: true },
    (snap) => {
      const todos = snap.docs
        .map((d) => docToTodo(d.id, d.data() as Record<string, unknown>))
        .filter((t): t is Todo => t !== null)
      onData(todos, snap.metadata.fromCache, snap.metadata.hasPendingWrites)
    },
    (err) => onError(err),
  )
}

export function subscribeHistory(
  uid: string,
  onData: (history: HistoryEntry[], fromCache: boolean, hasPendingWrites: boolean) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userHistoryCol(uid),
    { includeMetadataChanges: true },
    (snap) => {
      const history = snap.docs
        .map((d) => docToHistory(d.id, d.data() as Record<string, unknown>))
        .filter((h): h is HistoryEntry => h !== null)
        .sort((a, b) => b.completedAt - a.completedAt)
      onData(history, snap.metadata.fromCache, snap.metadata.hasPendingWrites)
    },
    (err) => onError(err),
  )
}

export function subscribeSettings(
  uid: string,
  onData: (settings: Settings) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    settingsDoc(uid),
    (snap) => {
      if (!snap.exists()) {
        onData({ ...DEFAULT_SETTINGS })
        return
      }
      const data = snap.data() as Partial<Settings>
      const interval = data.intervalMinutes
      onData({
        soundEnabled:
          typeof data.soundEnabled === 'boolean' ? data.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
        notificationsEnabled:
          typeof data.notificationsEnabled === 'boolean'
            ? data.notificationsEnabled
            : DEFAULT_SETTINGS.notificationsEnabled,
        intervalMinutes:
          interval === 15 || interval === 30 || interval === 60
            ? interval
            : DEFAULT_SETTINGS.intervalMinutes,
      })
    },
    (err) => onError(err),
  )
}

/** One-time import of browser localStorage into Firestore when cloud is empty. */
export async function migrateLocalDataIfNeeded(uid: string): Promise<boolean> {
  const mig = await getDoc(migrationDoc(uid))
  if (mig.exists() && mig.data()?.localStorageImported === true) {
    return false
  }

  const [todoSnap, historySnap] = await Promise.all([
    getDocs(userTodosCol(uid)),
    getDocs(userHistoryCol(uid)),
  ])

  if (!todoSnap.empty || !historySnap.empty) {
    await setDoc(migrationDoc(uid), { localStorageImported: true, importedAt: Date.now() }, { merge: true })
    return false
  }

  const localTodos = loadTodos()
  const localHistory = loadHistory()
  const localSettings = loadSettings()

  if (localTodos.length === 0 && localHistory.length === 0) {
    await setDoc(migrationDoc(uid), { localStorageImported: true, importedAt: Date.now() }, { merge: true })
    await setDoc(settingsDoc(uid), localSettings, { merge: true })
    return false
  }

  const db = getDb()
  let batch = writeBatch(db)
  let ops = 0

  const commitIfNeeded = async (force = false) => {
    if (ops === 0) return
    if (!force && ops < 400) return
    await batch.commit()
    batch = writeBatch(db)
    ops = 0
  }

  for (const todo of localTodos) {
    batch.set(doc(userTodosCol(uid), todo.id), todoToDoc(todo), { merge: true })
    ops += 1
    await commitIfNeeded()
  }
  for (const entry of localHistory) {
    batch.set(doc(userHistoryCol(uid), entry.id), historyToDoc(entry), { merge: true })
    ops += 1
    await commitIfNeeded()
  }
  batch.set(settingsDoc(uid), localSettings, { merge: true })
  ops += 1
  batch.set(migrationDoc(uid), { localStorageImported: true, importedAt: Date.now() }, { merge: true })
  ops += 1
  await commitIfNeeded(true)

  return true
}

export async function replaceTodosCloud(uid: string, todos: Todo[]): Promise<void> {
  const existing = await getDocs(userTodosCol(uid))
  const db = getDb()
  let batch = writeBatch(db)
  let ops = 0
  const flush = async (force = false) => {
    if (ops === 0) return
    if (!force && ops < 400) return
    await batch.commit()
    batch = writeBatch(db)
    ops = 0
  }

  const keep = new Set(todos.map((t) => t.id))
  for (const d of existing.docs) {
    if (!keep.has(d.id)) {
      batch.delete(d.ref)
      ops += 1
      await flush()
    }
  }
  for (const todo of todos) {
    batch.set(doc(userTodosCol(uid), todo.id), todoToDoc(todo), { merge: true })
    ops += 1
    await flush()
  }
  await flush(true)
}

export async function replaceHistoryCloud(uid: string, history: HistoryEntry[]): Promise<void> {
  const existing = await getDocs(userHistoryCol(uid))
  const db = getDb()
  let batch = writeBatch(db)
  let ops = 0
  const flush = async (force = false) => {
    if (ops === 0) return
    if (!force && ops < 400) return
    await batch.commit()
    batch = writeBatch(db)
    ops = 0
  }

  const keep = new Set(history.map((h) => h.id))
  for (const d of existing.docs) {
    if (!keep.has(d.id)) {
      batch.delete(d.ref)
      ops += 1
      await flush()
    }
  }
  for (const entry of history) {
    batch.set(doc(userHistoryCol(uid), entry.id), historyToDoc(entry), { merge: true })
    ops += 1
    await flush()
  }
  await flush(true)
}
