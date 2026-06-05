import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Auth — magic link (passwordless) sign-in.
 * Supabase sends a one-time link to the email; no password needed.
 */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // After clicking the magic link, user lands back here
        emailRedirectTo: window.location.href,
      },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
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
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'sending...' : 'send magic link'}
        </button>
      </form>
      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}
