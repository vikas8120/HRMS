import api from './axios'

export const fetchCompanies = async (params) => (await api.get('/super-admin/companies', { params })).data
export const createCompany = async (payload) => (await api.post('/super-admin/companies', payload)).data
export const getCompanyById = async (id) => (await api.get(`/super-admin/companies/${id}`)).data
export const updateCompany = async (id, payload) => (await api.put(`/super-admin/companies/${id}`, payload)).data
export const deleteCompany = async (id) => (await api.delete(`/super-admin/companies/${id}`)).data
export const updateCompanyStatus = async (id, status, reason = '') => (await api.patch(`/super-admin/companies/${id}/status`, { status, reason })).data
export const addBranch = async (id, payload) => (await api.post(`/super-admin/companies/${id}/branches`, payload)).data
export const updateBranch = async (id, branchId, payload) => (await api.put(`/super-admin/companies/${id}/branches/${branchId}`, payload)).data
export const deleteBranch = async (id, branchId) => (await api.delete(`/super-admin/companies/${id}/branches/${branchId}`)).data
export const updateBranding = async (id, payload) => (await api.put(`/super-admin/companies/${id}/branding`, payload)).data
export const updateDomain = async (id, payload) => (await api.put(`/super-admin/companies/${id}/domain`, payload)).data
export const fetchCompanyActivityLogs = async (id) => (await api.get(`/super-admin/companies/${id}/activity-logs`)).data
