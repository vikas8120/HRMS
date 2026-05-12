import api from './axios'

export const listAuditLogs = (params) => api.get('/super-admin/audit-security/logs', { params }).then((r) => r.data)
export const seedAuditLog = (payload) => api.post('/super-admin/audit-security/logs', payload).then((r) => r.data)
export const exportAuditLogs = (category = 'all') => api.get('/super-admin/audit-security/logs/export', { params: { category } }).then((r) => r.data)
export const listSecuritySettings = () => api.get('/super-admin/audit-security/settings').then((r) => r.data)
export const saveSecuritySetting = (payload) => api.put('/super-admin/audit-security/settings', payload).then((r) => r.data)
