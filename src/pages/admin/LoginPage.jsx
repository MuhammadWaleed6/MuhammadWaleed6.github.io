import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'

export default function LoginPage() {
  useDocumentMeta({ title: 'Admin login', noindex: true })
  const { signIn, sendPasswordReset, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) {
      setError(
        err.message?.includes('Invalid login')
          ? 'Invalid email or password.'
          : err.message || 'Login failed. Please try again.'
      )
      return
    }
    navigate(__ADMIN_BASE__, { replace: true })
  }

  async function onReset(e) {
    e.preventDefault()
    if (!email) {
      setError('Enter your email above first, then click "Forgot password".')
      return
    }
    setBusy(true)
    const { error: err } = await sendPasswordReset(email)
    setBusy(false)
    if (err) {
      setError(err.message || 'Could not send the reset email.')
      return
    }
    setResetSent(true)
    setError('')
  }

  if (isAdmin) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-mark">MW</div>
          <h1>You're signed in</h1>
          <p className="auth-sub">Redirecting to the dashboard…</p>
          <Link to={__ADMIN_BASE__} className="btn btn-primary btn-block">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-mark" aria-hidden="true">MW</div>
        <h1>Admin sign in</h1>
        <p className="auth-sub">Manage portfolio content, projects and messages.</p>

        {resetSent ? (
          <div className="form-banner success" role="status">
            <i className="pi pi-check-circle" aria-hidden="true" />
            <span>Password reset email sent. Check your inbox.</span>
          </div>
        ) : null}

        {error ? (
          <div className="form-banner error" role="alert">
            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" /> Signing in…
              </>
            ) : (
              <>
                Sign In <i className="pi pi-arrow-right" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-foot">
          <button type="button" className="btn-ghost btn btn-sm" onClick={onReset} disabled={busy}>
            Forgot password?
          </button>
          <Link to="/" className="text-muted">
            <i className="pi pi-arrow-left" aria-hidden="true" /> Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
