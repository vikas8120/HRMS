import api from './axios'

const withLegacyData = (res) => {
  const data = res?.data
  return { ...res, data }
}

const withLegacyList = (res) => {
  const list = res?.data || res?.items || []
  return { ...res, data: list }
}

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => withLegacyList(r.data))
export const createDepartment = (payload) => api.post('/admin/departments', payload).then((r) => withLegacyData(r.data))
export const updateDepartment = (id, payload) => api.put(`/admin/departments/${id}`, payload).then((r) => withLegacyData(r.data))
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`).then((r) => r.data)
export const getDepartmentEmployees = (id) => api.get(`/admin/departments/${id}/employees`).then((r) => withLegacyData(r.data))
export const getManagers = (params) => api.get('/admin/managers', { params }).then((r) => withLegacyList(r.data))
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => withLegacyList(r.data))
