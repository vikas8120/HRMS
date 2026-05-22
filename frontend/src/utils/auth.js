const TOKEN_KEY = 'token'
const USER_KEY = 'currentUser'

export const saveToken = (token, user = null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export const getCurrentUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_error) {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
