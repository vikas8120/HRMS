import api from './axios'

export const listGlobalUsers = (params) => api.get('/super-admin/global-users', { params }).then((r) => r.data)
export const createGlobalUser = (payload) => api.post('/super-admin/global-users', payload).then((r) => r.data)
export const updateGlobalUser = (id, payload) => api.put(`/super-admin/global-users/${id}`, payload).then((r) => r.data)
export const updateGlobalUserStatus = (id, status) => api.patch(`/super-admin/global-users/${id}/status`, { status }).then((r) => r.data)
export const forceLogoutUser = (id) => api.patch(`/super-admin/global-users/${id}/force-logout`).then((r) => r.data)
export const getLoginHistory = () => api.get('/super-admin/global-users/login-history').then((r) => r.data)
export const getActiveSessions = () => api.get('/super-admin/global-users/active-sessions').then((r) => r.data)
export const getFailedAttempts = () => api.get('/super-admin/global-users/failed-attempts').then((r) => r.data)
export const getDeviceTracking = () => api.get('/super-admin/global-users/device-tracking').then((r) => r.data)
export const bulkImportUsers = (users) => api.post('/super-admin/global-users/bulk-import', { users }).then((r) => r.data)
export const bulkExportUsers = () => api.get('/super-admin/global-users/bulk-export').then((r) => r.data)
