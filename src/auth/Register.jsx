import React, { useState } from 'react'
import { useAuth } from './AuthContext'

export default function Register({ onSwitch }) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      // client-side validation
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }
      const pwErr = validatePassword(password)
      if (pwErr) {
        setError(pwErr)
        setLoading(false)
        return
      }
      await register(email, password)
      setSuccess('Account created. Please sign in.')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function validatePassword(pw) {
    if (!pw || pw.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  return (
    <div className="auth-form">
      <h2>Create account</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="field-hint">Password must be at least 6 characters.</div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
      </form>
      <div className="auth-switch">Already have an account? <button onClick={() => onSwitch('login')}>Sign in</button></div>
    </div>
  )
}
