import api from './axios'

export const getAttendance = (params) => api.get('/admin/attendance', { params }).then((r) => r.data)
export const getTodayAttendance = (params) => api.get('/admin/attendance/today', { params }).then((r) => r.data)
export const getMonthlyAttendance = (params) => api.get('/admin/attendance/monthly', { params }).then((r) => r.data)
export const markManualAttendance = (payload) => api.post('/admin/attendance/manual', payload).then((r) => r.data)
export const updateAttendance = (id, payload) => api.put(`/admin/attendance/${id}`, payload).then((r) => r.data)

export const exportAttendance = async (params) => {
  const response = await api.get('/admin/attendance/export', { params, responseType: 'blob' })
  return response.data
}

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => r.data)
