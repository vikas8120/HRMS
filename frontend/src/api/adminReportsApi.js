import api from './axios'

export const getEmployeesReport = (params) => api.get('/admin/reports/employees', { params }).then((r) => r.data)
export const getAttendanceReport = (params) => api.get('/admin/reports/attendance', { params }).then((r) => r.data)
export const getLeavesReport = (params) => api.get('/admin/reports/leaves', { params }).then((r) => r.data)
export const getPayrollReport = (params) => api.get('/admin/reports/payroll', { params }).then((r) => r.data)
export const getDepartmentsReport = (params) => api.get('/admin/reports/departments', { params }).then((r) => r.data)
export const getSummaryReport = (params) => api.get('/admin/reports/summary', { params }).then((r) => r.data)

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => r.data)
