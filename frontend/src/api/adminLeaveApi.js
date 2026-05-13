import api from './axios'

const withLegacyData = (res) => {
  const data = res?.data
  return { ...res, data }
}

const withLegacyList = (res) => {
  const list = res?.data || res?.items || []
  return { ...res, data: list }
}

export const getLeaves = (params) => api.get('/admin/leaves', { params }).then((r) => withLegacyList(r.data))
export const createLeave = (payload) => api.post('/admin/leaves', payload).then((r) => withLegacyData(r.data))
export const approveLeave = (id) => api.patch(`/admin/leaves/${id}/approve`).then((r) => withLegacyData(r.data))
export const rejectLeave = (id, rejectionReason) => api.patch(`/admin/leaves/${id}/reject`, { rejectionReason }).then((r) => withLegacyData(r.data))
export const getLeaveBalance = (employeeId) => api.get(`/admin/leaves/balance/${employeeId}`).then((r) => withLegacyData(r.data))
export const getLeavePolicy = () => api.get('/admin/leaves/policy').then((r) => withLegacyData(r.data))
export const setLeavePolicy = (payload) => api.post('/admin/leaves/policy', payload).then((r) => withLegacyData(r.data))

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => withLegacyList(r.data))
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => withLegacyList(r.data))
