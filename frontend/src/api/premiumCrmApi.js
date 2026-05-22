import api from './axios'

export const getPremiumCrmOverview = () => api.get('/super-admin/dashboard/premium-crm').then((r) => r.data)
