import api from './axios'

export const generatePayroll = (payload) => api.post('/admin/payroll/generate', payload).then((r) => r.data)
export const getPayrollList = (params) => api.get('/admin/payroll', { params }).then((r) => r.data)
export const getPayrollById = (id) => api.get(`/admin/payroll/${id}`).then((r) => r.data)
export const updatePayroll = (id, payload) => api.put(`/admin/payroll/${id}`, payload).then((r) => r.data)

export const getPayslipBlob = async (id) => {
  const res = await api.get(`/admin/payroll/${id}/payslip`, { responseType: 'blob' })
  return res.data
}

export const getDepartments = (params) => api.get('/admin/departments', { params }).then((r) => r.data)
export const getEmployees = (params) => api.get('/admin/employees', { params }).then((r) => r.data)
