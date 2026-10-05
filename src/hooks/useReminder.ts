import { useCallback, useEffect, useRef, useState } from 'react'
import { playReminderBeep, unlockAudio } from '../audio'
import {
  buildBody,
  getNotificationPermission,
  requestNotificationPermission,
  showReminderNotification,
  type NotificationPermissionState,
} from '../notifications'
import { loadSettings, saveSettings } from '../storage'
import type { IntervalMinutes, Settings } from '../types'

export function useReminder(incompleteCount: number, incompleteTitles: string[]) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [lastRemindedAt, setLastRemindedAt] = useState<number | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    () => getNotificationPermission(),
  )
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const incompleteRef = useRef({ count: incompleteCount, titles: incompleteTitles })
  const settingsRef = useRef(settings)
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    incompleteRef.current = { count: incompleteCount, titles: incompleteTitles }
  }, [incompleteCount, incompleteTitles])

  useEffect(() => {
    settingsRef.current = settings
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const permission = getNotificationPermission()
    setNotificationPermission(permission)
    if (settings.notificationsEnabled && permission !== 'granted') {
      setSettings((prev) => ({ ...prev, notificationsEnabled: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 5000)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const fireReminder = useCallback(
    async (count: number, titles: string[]) => {
      const { soundEnabled, notificationsEnabled } = settingsRef.current
      if (count <= 0) return

      setLastRemindedAt(Date.now())
      const message = buildBody(titles)
      // Always show an in-app banner — OS banners are often suppressed while the tab is focused.
      setBannerMessage(message)

      // Prefer notification before sound so a long audio path cannot delay the alert.
      if (notificationsEnabled) {
        const shown = await showReminderNotification(titles)
        if (!shown) {
          showToast(message)
        }
      }

      if (soundEnabled) {
        try {
          await playReminderBeep()
        } catch {
          // Autoplay may still be blocked until a gesture; ignore.
        }
      }
    },
    [showToast],
  )

  useEffect(() => {
    const ms = settings.intervalMinutes * 60 * 1000
    const id = window.setInterval(() => {
      const { count, titles } = incompleteRef.current
      void fireReminder(count, titles)
    }, ms)
    return () => window.clearInterval(id)
  }, [settings.intervalMinutes, fireReminder])

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (patch.notificationsEnabled === true) {
        const permission = await requestNotificationPermission()
        setNotificationPermission(permission)

        if (permission !== 'granted') {
          setSettings((prev) => ({ ...prev, ...patch, notificationsEnabled: false }))
          if (permission === 'denied') {
            showToast(
              'Notifications are blocked for this site. Enable them in your browser settings, then try again.',
            )
          } else if (permission === 'unsupported') {
            showToast('This browser does not support notifications.')
          } else {
            showToast('Notification permission was not granted.')
          }
          try {
            await unlockAudio()
          } catch {
            // best-effort
          }
          return
        }
      }

      try {
        await unlockAudio()
      } catch {
        // Audio unlock is best-effort.
      }

      if (patch.notificationsEnabled === false) {
        setNotificationPermission(getNotificationPermission())
      }

      setSettings((prev) => ({ ...prev, ...patch }))
    },
    [showToast],
  )

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
      // best-effort
    }
    const { count, titles } = incompleteRef.current
    const safeTitles = count > 0 ? titles : ['Sample open task']
    await fireReminder(Math.max(count, 1), safeTitles)
  }, [fireReminder])

  const remindersActive = settings.soundEnabled || settings.notificationsEnabled

  return {
    settings,
    updateSettings,
    setIntervalMinutes,
    testReminder,
    lastRemindedAt,
    remindersActive,
    notificationPermission,
    toastMessage,
    bannerMessage,
    dismissToast: () => setToastMessage(null),
    dismissBanner: () => setBannerMessage(null),
  }
}
