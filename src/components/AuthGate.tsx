type Props = {
  signingIn: boolean
  error: string | null
  onSignIn: () => void
}

export function AuthGate({ signingIn, error, onSignIn }: Props) {
  return (
    <section className="auth-panel" aria-label="Sign in">
      <p className="brand">Todo Tracker</p>
      <h1>Your tasks, saved in the cloud</h1>
      <p className="auth-copy">
        Sign in with Google to keep todos and history even if you clear browser storage. Open this
        link on any device to continue where you left off.
      </p>
      <button
        type="button"
        className="btn btn-primary auth-google-btn"
        onClick={onSignIn}
        disabled={signingIn}
      >
        {signingIn ? 'Signing in…' : 'Continue with Google'}
      </button>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
