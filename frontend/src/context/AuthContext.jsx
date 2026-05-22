import { createContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { getCurrentUser, getToken, logout as clearAuth, saveToken } from '../utils/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getToken()
      const fallbackUser = getCurrentUser()
      if (!token) {
        clearAuth()
        setUser(null)
        setAuthLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        const nextUser = response?.data?.user || null
        if (nextUser) {
          saveToken(token, nextUser)
          setUser(nextUser)
        } else if (fallbackUser) {
          saveToken(token, fallbackUser)
          setUser(fallbackUser)
        } else {
          throw new Error('Invalid session')
        }
      } catch (error) {
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          clearAuth()
          setUser(null)
        } else if (fallbackUser) {
          saveToken(token, fallbackUser)
          setUser(fallbackUser)
        } else {
          clearAuth()
          setUser(null)
        }
      } finally {
        setAuthLoading(false)
      }
    }

    bootstrapAuth().catch(() => {
      clearAuth()
      setUser(null)
      setAuthLoading(false)
    })
  }, [])

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password })
    const payload = response?.data || {}
    const nextUser = payload?.user || null
    const token = payload?.token || ''
    if (!nextUser || !token) throw new Error(payload?.message || 'Login failed')
    saveToken(token, nextUser)
    setUser(nextUser)
    return payload
  }

  const logout = async () => {
    clearAuth()
    setUser(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const value = useMemo(() => ({ user, login, logout, authLoading }), [user, authLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
