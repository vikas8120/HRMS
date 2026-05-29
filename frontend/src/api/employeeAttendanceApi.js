import api from './axios'

export const getEmployeeAttendanceToday = () =>
  api.get('/employee/attendance/today').then((res) => res.data)

export const employeeCheckIn = (payload = {}) =>
  api.post('/employee/attendance/check-in', payload).then((res) => res.data)

export const employeeCheckOut = () =>
  api.post('/employee/attendance/check-out').then((res) => res.data)

export const resetEmployeeAttendanceToday = () =>
  api.post('/employee/attendance/reset-today').then((res) => res.data)

export const getEmployeeAttendanceMonthly = (params = {}) =>
  api.get('/employee/attendance/monthly', { params }).then((res) => res.data)

export const getEmployeeAttendanceHistory = (params = {}) =>
  api.get('/employee/attendance/history', { params }).then((res) => res.data)

export const requestEmployeeAttendanceRegularization = (payload) =>
  api.post('/employee/attendance/regularization-request', payload).then((res) => res.data)
