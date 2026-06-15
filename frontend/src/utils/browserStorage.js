const safeStorage = (storageType) => {
  if (typeof window === 'undefined') return null
  try {
    const storage = storageType === 'local' ? window.localStorage : window.sessionStorage
    const testKey = '__hrms_storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

export const readJsonStorage = (key, fallback = null, storageType = 'session') => {
  const storage = safeStorage(storageType)
  if (!storage) return fallback
  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const writeJsonStorage = (key, value, storageType = 'session') => {
  const storage = safeStorage(storageType)
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota / access errors in demo-only frontend state.
  }
}
