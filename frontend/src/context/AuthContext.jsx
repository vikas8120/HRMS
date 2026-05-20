import { createContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { getToken, logout as clearAuth, saveToken } from '../utils/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getToken()
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        const nextUser = response?.data?.user || null
        setUser(nextUser)
        if (nextUser) saveToken(token, nextUser)
      } catch (_error) {
        clearAuth()
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { email: identifier, identifier, password })
    const token = response?.data?.token
    const nextUser = response?.data?.user || null
    saveToken(token, nextUser)
    setUser(nextUser)
    return response?.data || {}
  }

  const logout = async () => {
    clearAuth()
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout, authLoading }), [user, authLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
