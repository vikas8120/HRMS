import api from './axios'

export const fetchAdmins = async (params) => {
  const response = await api.get('/super-admin/admins', { params })
  return response.data
}

export const createAdmin = async (payload) => {
  const response = await api.post('/super-admin/admins', payload)
  return response.data
}

export const getAdminById = async (id) => {
  const response = await api.get(`/super-admin/admins/${id}`)
  return response.data
}

export const updateAdmin = async (id, payload) => {
  const response = await api.put(`/super-admin/admins/${id}`, payload)
  return response.data
}

export const deleteAdmin = async (id) => {
  const response = await api.delete(`/super-admin/admins/${id}`)
  return response.data
}

export const updateAdminStatus = async (id, status) => {
  const response = await api.patch(`/super-admin/admins/${id}/status`, { status })
  return response.data
}

export const resetAdminPassword = async (id, password) => {
  const response = await api.patch(`/super-admin/admins/${id}/reset-password`, { password })
  return response.data
}

export const assignCompanies = async (id, companyIds) => {
  const response = await api.patch(`/super-admin/company-admins/${id}/assign-companies`, { companyIds })
  return response.data
}

export const fetchTenantCompanies = async () => {
  const response = await api.get('/super-admin/companies/dropdown')
  return response.data
}

export const fetchAccessLogs = async () => {
  const response = await api.get('/super-admin/admin-logs/access')
  return response.data
}

export const fetchActivityLogs = async () => {
  const response = await api.get('/super-admin/admin-logs/activity')
  return response.data
}

export const fetchRoles = async () => {
  const response = await api.get('/super-admin/roles')
  return response.data
}

export const createRole = async (payload) => {
  const response = await api.post('/super-admin/roles', payload)
  return response.data
}

export const updateRolePermissions = async (id, permissions) => {
  const response = await api.put(`/super-admin/roles/${id}/permissions`, { permissions })
  return response.data
}

export const assignRoleToAdmin = async (adminId, role) => {
  const response = await api.patch('/super-admin/assign-role', { adminId, role })
  return response.data
}
