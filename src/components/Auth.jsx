import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode,     setMode]     = useState('magic')   // 'magic' | 'password'
  const [isSignUp, setIsSignUp] = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState(null)

  function switchMode(m) { setMode(m); setError(null); setSent(false) }

  async function handleMagicLink(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handlePassword(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    // success: onAuthStateChange in App.jsx handles session
  }

  if (sent) return (
    <div className="auth-wrap">
      <h1>vibeslogger</h1>
      <p>check your email — magic link sent to <strong>{email}</strong></p>
      <button className="btn-ghost" onClick={() => setSent(false)}>use a different email</button>
    </div>
  )

  return (
    <div className="auth-wrap">
      <h1>vibeslogger</h1>
      <p className="auth-sub">log your position on the vibe spectrum</p>

      <div className="auth-modes">
        <button
          className={`auth-mode-tab ${mode === 'magic' ? 'auth-mode-tab--active' : ''}`}
          onClick={() => switchMode('magic')}
        >
          magic link
        </button>
        <button
          className={`auth-mode-tab ${mode === 'password' ? 'auth-mode-tab--active' : ''}`}
          onClick={() => switchMode('password')}
        >
          password
        </button>
      </div>

      {mode === 'magic' ? (
        <form onSubmit={handleMagicLink} className="auth-form">
          <input
            type="email" placeholder="your email" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'sending...' : 'send magic link'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePassword} className="auth-form">
          <input
            type="email" placeholder="your email" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus
          />
          <input
            type="password" placeholder="password" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : isSignUp ? 'create account' : 'sign in'}
          </button>
          <button
            type="button" className="btn-ghost auth-toggle"
            onClick={() => { setIsSignUp(v => !v); setError(null) }}
          >
            {isSignUp ? 'already have an account? sign in' : "new here? create account"}
          </button>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}
