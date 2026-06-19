import api from './axios'

const q = (params) => ({ params })

export const listRevenueAnalytics = (params) => api.get('/super-admin/revenue-analytics', q(params)).then((r) => r.data)
export const getRevenueAnalyticsSummary = () => api.get('/super-admin/revenue-analytics/summary').then((r) => r.data)
export const refreshRevenueAnalytics = () => api.post('/super-admin/revenue-analytics/refresh').then((r) => r.data)
