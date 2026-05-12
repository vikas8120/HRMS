import api from './axios'

export const getLeaves = (params) => api.get('/admin/leaves', { params }).then((r) => r.data)
export const approveLeave = (id) => api.patch(`/admin/leaves/${id}/approve`).then((r) => r.data)
export const rejectLeave = (id, rejectionReason) => api.patch(`/admin/leaves/${id}/reject`, { rejectionReason }).then((r) => r.data)
export const getLeaveBalance = (employeeId) => api.get(`/admin/leaves/balance/${employeeId}`).then((r) => r.data)
export const getLeavePolicy = () => api.get('/admin/leaves/policy').then((r) => r.data)
export const setLeavePolicy = (payload) => api.post('/admin/leaves/policy', payload).then((r) => r.data)

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
