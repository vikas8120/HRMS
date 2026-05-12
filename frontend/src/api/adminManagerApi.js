import api from './axios'

export const getManagers = (params) => api.get('/admin/managers', { params }).then((r) => r.data)
export const getManagerById = (id) => api.get(`/admin/managers/${id}`).then((r) => r.data)
export const createManager = (payload) => api.post('/admin/managers', payload).then((r) => r.data)
export const updateManager = (id, payload) => api.put(`/admin/managers/${id}`, payload).then((r) => r.data)
export const deleteManager = (id) => api.delete(`/admin/managers/${id}`).then((r) => r.data)
export const updateManagerStatus = (id, status) => api.patch(`/admin/managers/${id}/status`, { status }).then((r) => r.data)
export const assignManagerEmployees = (id, assignedEmployees) => api.patch(`/admin/managers/${id}/assign-employees`, { assignedEmployees }).then((r) => r.data)

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => r.data)
