import api from './axios'

export const getHRList = (params) => api.get('/admin/hr', { params }).then((r) => r.data)
export const createHR = (payload) => api.post('/admin/hr', payload).then((r) => r.data)
export const updateHR = (id, payload) => api.put(`/admin/hr/${id}`, payload).then((r) => r.data)
export const deleteHR = (id) => api.delete(`/admin/hr/${id}`).then((r) => r.data)
export const updateHRStatus = (id, status) => api.patch(`/admin/hr/${id}/status`, { status }).then((r) => r.data)
