import { useCallback, useEffect, useRef, useState } from 'react'
import { playReminderBeep, unlockAudio } from '../audio'
import { loadSettings, saveSettings } from '../storage'
import type { IntervalMinutes, Settings } from '../types'

async function showNotification(incompleteCount: number): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const body =
    incompleteCount === 1
      ? 'You still have 1 task open.'
      : `You still have ${incompleteCount} tasks open.`

  try {
    new Notification('Todo Tracker', { body, tag: 'todo-tracker-reminder' })
  } catch {
    // Some environments block Notification construction; ignore.
  }
}

export function useReminder(incompleteCount: number) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [lastRemindedAt, setLastRemindedAt] = useState<number | null>(null)
  const incompleteRef = useRef(incompleteCount)
  const settingsRef = useRef(settings)

  useEffect(() => {
    incompleteRef.current = incompleteCount
  }, [incompleteCount])

  useEffect(() => {
    settingsRef.current = settings
    saveSettings(settings)
  }, [settings])

  const fireReminder = useCallback(async (count: number) => {
    const { soundEnabled, notificationsEnabled } = settingsRef.current
    if (count <= 0) return

    setLastRemindedAt(Date.now())

    if (soundEnabled) {
      try {
        await playReminderBeep()
      } catch {
        // Autoplay may still be blocked until a gesture; ignore.
      }
    }

    if (notificationsEnabled) {
      await showNotification(count)
    }
  }, [])

  useEffect(() => {
    const ms = settings.intervalMinutes * 60 * 1000
    const id = window.setInterval(() => {
      void fireReminder(incompleteRef.current)
    }, ms)
    return () => window.clearInterval(id)
  }, [settings.intervalMinutes, fireReminder])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    try {
      await unlockAudio()
    } catch {
      // Audio unlock is best-effort.
    }

    if (patch.notificationsEnabled === true && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') {
        patch = { ...patch, notificationsEnabled: false }
      }
    }

    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const setIntervalMinutes = useCallback(
    (intervalMinutes: IntervalMinutes) => {
      void updateSettings({ intervalMinutes })
    },
    [updateSettings],
  )

  const testReminder = useCallback(async () => {
    try {
      await unlockAudio()
    } catch {
      // Audio unlock is best-effort; reminder status should still update.
    }
    const count = incompleteRef.current > 0 ? incompleteRef.current : 1
    await fireReminder(count)
  }, [fireReminder])

  const remindersActive = settings.soundEnabled || settings.notificationsEnabled

  return {
    settings,
    updateSettings,
    setIntervalMinutes,
    testReminder,
    lastRemindedAt,
    remindersActive,
  }
}
