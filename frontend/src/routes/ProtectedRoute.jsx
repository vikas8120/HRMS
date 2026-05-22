import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getCurrentUser, getToken } from '../utils/auth'

const roleDashboardMap = {
  platform_admin: '/super-admin/dashboard',
  superadmin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  hr: '/hr/dashboard',
  manager: '/manager/dashboard',
  employee: '/employee/dashboard'
}

function ProtectedRoute({ allowedRoles = [] }) {
  const { user, authLoading } = useAuth()

  if (authLoading) return <div className="panel">Checking authentication...</div>

  const token = getToken()
  if (!token) {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    return <Navigate to="/login" replace />
  }

  const fallbackUser = getCurrentUser()
  const resolvedUser = user || fallbackUser
  const role = String(resolvedUser?.role || '').toLowerCase()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={roleDashboardMap[role] || '/login'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
