const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const saveToken = (token, user = null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))

  const role = String(user?.role || '').toLowerCase()
  if (role === 'platform_admin') {
    localStorage.setItem('super_admin_token', token || '')
    localStorage.removeItem('admin_token')
  } else if (role) {
    localStorage.setItem('admin_token', token || '')
    localStorage.removeItem('super_admin_token')
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || ''

export const getCurrentUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_error) {
    return null
  }
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('admin_token')
  localStorage.removeItem('super_admin_token')
}
