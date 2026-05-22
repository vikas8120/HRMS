import axios from 'axios'
import { getToken, logout } from '../utils/auth'
import { handleDemoRequest, isDemoMode } from '../mocks/demoApi'

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const baseURL = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT.replace(/\/$/, '')}/api`

const api = axios.create({
  baseURL
})

const liveAdapter = axios.getAdapter ? axios.getAdapter(axios.defaults.adapter) : null
api.defaults.adapter = async (config) => {
  if (isDemoMode()) {
    return handleDemoRequest(config)
  }
  if (liveAdapter) {
    return liveAdapter(config)
  }
  return handleDemoRequest(config)
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      logout()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
