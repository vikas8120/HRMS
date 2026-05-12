import api from './axios'

export const listPlatformOverview = (params) => api.get('/super-admin/dashboard/platform-overview', { params }).then((r) => r.data)
export const createPlatformOverview = (payload) => api.post('/super-admin/dashboard/platform-overview', payload).then((r) => r.data)
export const getPlatformOverviewById = (id) => api.get(`/super-admin/dashboard/platform-overview/${id}`).then((r) => r.data)
export const updatePlatformOverview = (id, payload) => api.put(`/super-admin/dashboard/platform-overview/${id}`, payload).then((r) => r.data)
export const deletePlatformOverview = (id) => api.delete(`/super-admin/dashboard/platform-overview/${id}`).then((r) => r.data)
