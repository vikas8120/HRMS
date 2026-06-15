const TOKEN_KEY = 'token'
const USER_KEY = 'currentUser'

const getStorageCandidates = () => {
  if (typeof window === 'undefined') return []
  return [window.sessionStorage, window.localStorage].filter(Boolean)
}

const readFromStorage = (key) => {
  const [primary, fallback] = getStorageCandidates()
  const primaryValue = primary?.getItem(key)
  if (primaryValue !== null) return primaryValue

  const fallbackValue = fallback?.getItem(key)
  if (fallbackValue !== null && primary) {
    primary.setItem(key, fallbackValue)
    fallback.removeItem(key)
  }
  return fallbackValue
}

const writeToStorage = (key, value) => {
  const [primary, fallback] = getStorageCandidates()
  if (!primary) return
  primary.setItem(key, value)
  fallback?.removeItem(key)
}

const removeFromStorage = (key) => {
  getStorageCandidates().forEach((storage) => storage.removeItem(key))
}

export const saveToken = (token, user = null) => {
  if (token) {
    writeToStorage(TOKEN_KEY, token)
  } else {
    removeFromStorage(TOKEN_KEY)
  }

  if (user) {
    writeToStorage(USER_KEY, JSON.stringify(user))
  } else {
    removeFromStorage(USER_KEY)
  }
}

export const getToken = () => {
  return readFromStorage(TOKEN_KEY) || ''
}

export const getCurrentUser = () => {
  const raw = readFromStorage(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (_error) {
    removeFromStorage(USER_KEY)
    return null
  }
}

export const logout = () => {
  removeFromStorage(TOKEN_KEY)
  removeFromStorage(USER_KEY)
}
