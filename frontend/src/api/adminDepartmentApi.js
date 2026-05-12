import api from './axios'

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const createDepartment = (payload) => api.post('/admin/departments', payload).then((r) => r.data)
export const updateDepartment = (id, payload) => api.put(`/admin/departments/${id}`, payload).then((r) => r.data)
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`).then((r) => r.data)
export const getDepartmentEmployees = (id) => api.get(`/admin/departments/${id}/employees`).then((r) => r.data)
export const getManagers = (params) => api.get('/admin/managers', { params }).then((r) => r.data)
