import { useCallback, useEffect, useState } from 'react'
import {
  completeGoogleRedirect,
  mapAuthError,
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  type AuthUser,
} from '../firebase/auth'
import { migrateLocalDataIfNeeded } from '../firebase/sync'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    let cancelled = false

    void completeGoogleRedirect().catch(() => {
      // No redirect result is fine.
    })

    const unsub = subscribeAuth((next) => {
      if (cancelled) return
      setUser(next)
      setLoading(false)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function prepare(uid: string) {
      setMigrating(true)
      setReady(false)
      setError(null)
      try {
        await migrateLocalDataIfNeeded(uid)
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || 'Could not load cloud data.')
          setReady(true)
        }
      } finally {
        if (!cancelled) setMigrating(false)
      }
    }

    if (!user) {
      setReady(false)
      setMigrating(false)
      return
    }

    void prepare(user.uid)
    return () => {
      cancelled = true
    }
  }, [user])

  const signIn = useCallback(async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    try {
      await signOutUser()
    } catch (err) {
      setError(mapAuthError(err))
    }
  }, [])

  return {
    user,
    loading,
    migrating,
    ready: Boolean(user) && ready && !migrating,
    error,
    signingIn,
    signIn,
    signOut,
    clearError: () => setError(null),
  }
}
