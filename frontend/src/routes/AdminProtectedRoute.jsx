import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import api from '../api/axios'

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
      const adminToken = localStorage.getItem('admin_token')
      const fallbackToken = localStorage.getItem('super_admin_token')
      const token = adminToken || fallbackToken

      if (!token) {
        setAuthState({ loading: false, allow: false, redirect: '/login' })
        return
      }

      const payload = parseTokenPayload(token)
      if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('super_admin_token')
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

      try {
        const response = await api.get('/admin/auth/me')
        const apiRole = normalizeRole(response?.data?.data?.role || response?.data?.role)

        if (apiRole === 'admin') {
          setAuthState({ loading: false, allow: true, redirect: '' })
          return
        }

        setAuthState({
          loading: false,
          allow: false,
          redirect: roleRedirectMap[apiRole] || '/login'
        })
      } catch (_error) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('super_admin_token')
        setAuthState({ loading: false, allow: false, redirect: '/login' })
      }
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
