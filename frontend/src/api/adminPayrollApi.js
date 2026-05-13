import api from './axios'

const withLegacyData = (res) => {
  const data = res?.data
  return { ...res, data }
}

const withLegacyList = (res) => {
  const list = res?.data || res?.items || []
  return { ...res, data: list }
}

export const generatePayroll = (payload) => api.post('/admin/payroll/generate', payload).then((r) => withLegacyList(r.data))
export const getPayrollList = (params) => api.get('/admin/payroll', { params }).then((r) => withLegacyList(r.data))
export const getPayrollById = (id) => api.get(`/admin/payroll/${id}`).then((r) => withLegacyData(r.data))
export const getPayrollByEmployee = (employeeId) => api.get(`/admin/payroll/employee/${employeeId}`).then((r) => withLegacyList(r.data))
export const updatePayroll = (id, payload) => api.put(`/admin/payroll/${id}`, payload).then((r) => withLegacyData(r.data))
export const getSettings = () => api.get('/admin/settings').then((r) => withLegacyData(r.data))
export const updatePayrollSettings = (payload) => api.put('/admin/settings/payroll', payload).then((r) => withLegacyData(r.data))

export const getPayslipBlob = async (id) => {
  const res = await api.get(`/admin/payroll/${id}/payslip`, { responseType: 'blob' })
  return res.data
}

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => withLegacyList(r.data))
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => withLegacyList(r.data))
