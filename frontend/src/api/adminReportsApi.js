import api from './axios'

const withLegacyData = (res) => {
  const data = res?.data
  return { ...res, data }
}

const withLegacyRecords = (res) => {
  const data = res?.data || {}
  const records = data?.records || res?.items || res?.data || []
  return { ...res, data: { ...data, records } }
}

export const getAdminReports = (params) => api.get('/admin/reports', { params }).then((r) => withLegacyData(r.data))
export const getEmployeesReport = (params) => api.get('/admin/reports/employees', { params }).then((r) => withLegacyRecords(r.data))
export const getAttendanceReport = (params) => api.get('/admin/reports/attendance', { params }).then((r) => withLegacyRecords(r.data))
export const getLeavesReport = (params) => api.get('/admin/reports/leaves', { params }).then((r) => withLegacyRecords(r.data))
export const getPayrollReport = (params) => api.get('/admin/reports/payroll', { params }).then((r) => withLegacyRecords(r.data))
export const getDepartmentsReport = (params) => api.get('/admin/reports/departments', { params }).then((r) => withLegacyRecords(r.data))
export const getSummaryReport = (params) => api.get('/admin/reports/summary', { params }).then((r) => withLegacyData(r.data))

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => ({ ...r.data, data: r.data?.data || r.data?.items || [] }))
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => ({ ...r.data, data: r.data?.data || r.data?.items || [] }))
