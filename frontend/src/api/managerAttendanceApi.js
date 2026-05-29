import api from './axios'

export const getManagerAttendance = (params = {}) =>
  api.get('/manager/attendance', { params }).then((res) => res.data)

export const getManagerAttendanceToday = (params = {}) =>
  api.get('/manager/attendance/today', { params }).then((res) => res.data)

export const getManagerMyAttendanceToday = () =>
  api.get('/manager/attendance/my-today').then((res) => res.data)

export const managerPunchInAttendance = (payload = {}) =>
  api.post('/manager/attendance/check-in', payload).then((res) => res.data)

export const managerPunchOutAttendance = () =>
  api.post('/manager/attendance/check-out').then((res) => res.data)

export const resetManagerAttendanceToday = () =>
  api.post('/manager/attendance/reset-today').then((res) => res.data)

export const getManagerEmployeeAttendance = (employeeId, params = {}) =>
  api.get(`/manager/attendance/${employeeId}`, { params }).then((res) => res.data)

export const getManagerAttendanceReports = (params = {}) =>
  api.get('/manager/attendance/reports', { params }).then((res) => res.data)

export const getManagerAttendanceAlerts = (params = {}) =>
  api.get('/manager/attendance/alerts', { params }).then((res) => res.data)
