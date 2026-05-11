import React, { useState } from 'react'
import { useAuth } from './AuthContext'

export default function Login({ onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // client-side validation
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Sign in</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="field-hint">Use the password associated with your account.</div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div className="auth-switch">Don't have an account? <button onClick={() => onSwitch('register')}>Create one</button></div>
    </div>
  )
}
