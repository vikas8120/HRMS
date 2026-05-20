import api from './axios'

export const getEmployeePayrollHistory = () =>
  api.get('/employee/payroll').then((res) => res.data)

export const getEmployeeLatestPayslip = () =>
  api.get('/employee/payroll/latest').then((res) => res.data)

export const getEmployeePayrollById = (id) =>
  api.get(`/employee/payroll/${id}`).then((res) => res.data)

export const downloadEmployeePayslipPdf = async (id) => {
  const response = await api.get(`/employee/payroll/${id}/payslip`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `payslip-${id}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
