import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import { getFirebaseApp } from './db'

let auth: Auth | null = null
const provider = new GoogleAuthProvider()

function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

export function subscribeAuth(callback: (user: AuthUser | null) => void): () => void {
  const a = getFirebaseAuth()
  void setPersistence(a, browserLocalPersistence)
  return onAuthStateChanged(a, (user) => {
    callback(user ? toAuthUser(user) : null)
  })
}

function shouldUseRedirect(): boolean {
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod|Android/i.test(ua)
}

export async function signInWithGoogle(): Promise<void> {
  const a = getFirebaseAuth()
  await setPersistence(a, browserLocalPersistence)
  if (shouldUseRedirect()) {
    await signInWithRedirect(a, provider)
    return
  }
  try {
    await signInWithPopup(a, provider)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(a, provider)
      return
    }
    throw err
  }
}

export async function completeGoogleRedirect(): Promise<AuthUser | null> {
  const a = getFirebaseAuth()
  const result = await getRedirectResult(a)
  return result?.user ? toAuthUser(result.user) : null
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || ''
  const messages: Record<string, string> = {
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups or try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/unauthorized-domain':
      'This domain is not authorized in Firebase. Add localhost and shankar5459.github.io under Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed':
      'Google sign-in is not enabled yet. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/internal-error': 'Sign-in failed. Please try again.',
  }
  return messages[code] || (error as Error)?.message || 'Sign-in failed. Please try again.'
}
