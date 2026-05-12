import axiosInstance from '../api/axios'

const getToken = () => localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || ''

const withAuthHeaders = (config = {}) => {
  const token = getToken()
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
}

const normalizeError = (error) => {
  const message = error?.response?.data?.message || error?.message || 'Request failed'
  const status = error?.response?.status || 500
  const details = error?.response?.data || null
  const normalized = new Error(message)
  normalized.status = status
  normalized.details = details
  throw normalized
}

const request = async (method, url, { data, params } = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      params,
      ...withAuthHeaders()
    })
    return response.data
  } catch (error) {
    normalizeError(error)
  }
}

export const getAdminDashboard = async () => {
  const res = await request('get', '/admin/dashboard')
  return res?.data
}

export const getHRList = (params) => request('get', '/admin/hr', { params })
export const createHR = (payload) => request('post', '/admin/hr', { data: payload })
export const updateHR = (id, payload) => request('put', `/admin/hr/${id}`, { data: payload })
export const deleteHR = (id) => request('delete', `/admin/hr/${id}`)

export const getManagers = (params) => request('get', '/admin/managers', { params })
export const createManager = (payload) => request('post', '/admin/managers', { data: payload })
export const updateManager = (id, payload) => request('put', `/admin/managers/${id}`, { data: payload })
export const deleteManager = (id) => request('delete', `/admin/managers/${id}`)

export const getEmployees = (params) => request('get', '/admin/employees', { params })
export const createEmployee = (payload) => request('post', '/admin/employees', { data: payload })
export const updateEmployee = (id, payload) => request('put', `/admin/employees/${id}`, { data: payload })
export const deleteEmployee = (id) => request('delete', `/admin/employees/${id}`)

export const getDepartments = (params) => request('get', '/admin/departments', { params })
export const createDepartment = (payload) => request('post', '/admin/departments', { data: payload })
export const updateDepartment = (id, payload) => request('put', `/admin/departments/${id}`, { data: payload })
export const deleteDepartment = (id) => request('delete', `/admin/departments/${id}`)

export const getAttendance = (params) => request('get', '/admin/attendance', { params })
export const markManualAttendance = (payload) => request('post', '/admin/attendance/manual', { data: payload })

export const getLeaves = (params) => request('get', '/admin/leaves', { params })
export const approveLeave = (id) => request('patch', `/admin/leaves/${id}/approve`)
export const rejectLeave = (id, rejectionReason) => request('patch', `/admin/leaves/${id}/reject`, { data: { rejectionReason } })

export const getPayroll = (params) => request('get', '/admin/payroll', { params })
export const generatePayroll = (payload) => request('post', '/admin/payroll/generate', { data: payload })

export const getReports = (params) => request('get', '/admin/reports/summary', { params })

export const getSettings = () => request('get', '/admin/settings')
export const updateSettings = (payload) => request('put', '/admin/settings', { data: payload })

export default {
  getAdminDashboard,
  getHRList,
  createHR,
  updateHR,
  deleteHR,
  getManagers,
  createManager,
  updateManager,
  deleteManager,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAttendance,
  markManualAttendance,
  getLeaves,
  approveLeave,
  rejectLeave,
  getPayroll,
  generatePayroll,
  getReports,
  getSettings,
  updateSettings
}
