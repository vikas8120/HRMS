import api from './axios'

export const listPerformanceReviews = (params) => api.get('/admin/performance', { params }).then((r) => r.data)
export const createPerformanceReview = (payload) => api.post('/admin/performance', payload).then((r) => r.data)
export const updatePerformanceReview = (id, payload) => api.put(`/admin/performance/${id}`, payload).then((r) => r.data)
export const deletePerformanceReview = (id) => api.delete(`/admin/performance/${id}`).then((r) => r.data)
export const archivePerformanceReview = (id) => api.patch(`/admin/performance/${id}/archive`).then((r) => r.data)
