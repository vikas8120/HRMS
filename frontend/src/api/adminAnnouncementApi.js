import api from './axios'

export const listAnnouncements = (params) => api.get('/admin/announcements', { params }).then((r) => r.data)
export const createAnnouncement = (payload) => api.post('/admin/announcements', payload).then((r) => r.data)
export const updateAnnouncement = (id, payload) => api.put(`/admin/announcements/${id}`, payload).then((r) => r.data)
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`).then((r) => r.data)
export const archiveAnnouncement = (id) => api.patch(`/admin/announcements/${id}/archive`).then((r) => r.data)
export const acknowledgeAnnouncement = (id) => api.patch(`/admin/announcements/${id}/acknowledge`).then((r) => r.data)
