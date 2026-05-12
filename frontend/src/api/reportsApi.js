import api from './axios'

export const listReports = (params) => api.get('/super-admin/reports', { params }).then((r) => r.data)
export const generateReport = (payload) => api.post('/super-admin/reports/generate', payload).then((r) => r.data)
