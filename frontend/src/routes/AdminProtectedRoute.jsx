import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../utils/auth'

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

const isTokenExpired = (payload) => {
  if (!payload?.exp) return false
  const expiry = Number(payload.exp) * 1000
  return Number.isFinite(expiry) ? Date.now() >= expiry : false
}

const normalizeRole = (role) => String(role || '').trim().toLowerCase()

const roleRedirectMap = {
  platform_admin: '/platform-admin/dashboard',
  super_admin: '/platform-admin/dashboard',
  hr: '/hr/dashboard',
  manager: '/manager/dashboard',
  employee: '/employee/dashboard'
}

function AdminProtectedRoute() {
  const [authState, setAuthState] = useState({ loading: true, allow: false, redirect: '/login' })

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = getToken()

      if (!token) {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
        setAuthState({ loading: false, allow: false, redirect: '/login' })
        return
      }

      const payload = parseTokenPayload(token)
      if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
        setAuthState({ loading: false, allow: false, redirect: '/login' })
        return
      }

      const tokenRole = normalizeRole(payload.role)

      if (tokenRole && tokenRole !== 'admin') {
        setAuthState({
          loading: false,
          allow: false,
          redirect: roleRedirectMap[tokenRole] || '/login'
        })
        return
      }
      setAuthState({ loading: false, allow: true, redirect: '' })
    }

    verifyAdminAccess()
  }, [])

  if (authState.loading) {
    return <div className="panel">Checking admin access...</div>
  }

  if (!authState.allow) {
    return <Navigate to={authState.redirect} replace />
  }

  return <Outlet />
}

export default AdminProtectedRoute
