import api from './axios'

export const getCompanyAdminDashboard = () => api.get('/admin/dashboard').then((r) => r.data)
