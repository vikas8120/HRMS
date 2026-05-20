import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/ui/FormInput'
import Button from '../components/ui/Button'

function LoginPage() {
  const { user, login, authLoading } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!authLoading && user) {
    const role = String(user?.role || '').toLowerCase()
    if (role === 'platform_admin') return <Navigate to="/super-admin/dashboard" replace />
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'hr') return <Navigate to="/hr/dashboard" replace />
    if (role === 'manager') return <Navigate to="/manager/dashboard" replace />
    if (role === 'employee') return <Navigate to="/employee/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(identifier, password)
      navigate(response?.redirectUrl || '/login', { replace: true })
    } catch (err) {
      if (!err?.response) {
        setError('Unable to reach server. Start backend API and try again.')
      } else {
        setError(err?.response?.data?.message || 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card login-card--auth" onSubmit={handleSubmit}>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in with your work credentials.</p>
        {error ? <div className="toast toast-error">{error}</div> : null}
        <FormInput label="Email or Admin ID" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        <label className="form-input-wrap">
          <span>Password</span>
          <div className="password-input-wrap">
            <input
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="icon-btn" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <Button className="login-submit-btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
      </form>
    </div>
  )
}

export default LoginPage
