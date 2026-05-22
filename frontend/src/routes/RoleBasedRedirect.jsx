import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getCurrentUser, getToken } from '../utils/auth'

function RoleBasedRedirect() {
  const { user, authLoading } = useAuth()

  if (authLoading) return <div className="panel">Checking authentication...</div>

  const token = getToken()
  const fallbackUser = getCurrentUser()
  const resolvedUser = user || (token ? fallbackUser : null)

  if (!resolvedUser) return <Navigate to="/login" replace />

  const role = String(resolvedUser.role || '').toLowerCase()
  if (role === 'platform_admin' || role === 'superadmin') return <Navigate to="/super-admin/dashboard" replace />
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'hr') return <Navigate to="/hr/dashboard" replace />
  if (role === 'manager') return <Navigate to="/manager/dashboard" replace />
  if (role === 'employee') return <Navigate to="/employee/dashboard" replace />

  return <Navigate to="/login" replace />
}

export default RoleBasedRedirect
