import api from './axios'

export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => r.data)
export const getEmployeeById = (id) => api.get(`/admin/employees/${id}`).then((r) => r.data)
export const createEmployee = (payload) => api.post('/admin/employees', payload).then((r) => r.data)
export const updateEmployee = (id, payload) => api.put(`/admin/employees/${id}`, payload).then((r) => r.data)
export const deleteEmployee = (id) => api.delete(`/admin/employees/${id}`).then((r) => r.data)
export const updateEmployeeStatus = (id, status) => api.patch(`/admin/employees/${id}/status`, { status }).then((r) => r.data)

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const getManagers = (params) => api.get('/admin/managers', { params }).then((r) => r.data)
export const getHRList = (params) => api.get('/admin/hr', { params }).then((r) => r.data)
