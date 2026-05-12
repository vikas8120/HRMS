import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getToken, logout } from '../utils/auth'

const roleDashboardMap = {
  platform_admin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  hr: '/hr/dashboard',
  manager: '/manager/dashboard',
  employee: '/employee/dashboard'
}

const parseTokenPayload = (token) => {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (_error) {
    return null
  }
}

function ProtectedRoute({ allowedRoles = [] }) {
  const { user, authLoading } = useAuth()

  if (authLoading) return <div className="panel">Checking authentication...</div>

  const token = getToken()
  if (!token) return <Navigate to="/login" replace />

  const payload = parseTokenPayload(token)
  if (!payload || (payload?.exp && Date.now() >= Number(payload.exp) * 1000)) {
    logout()
    return <Navigate to="/login" replace />
  }

  const role = String(user?.role || '').toLowerCase()
  if (!role) {
    logout()
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={roleDashboardMap[role] || '/login'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
