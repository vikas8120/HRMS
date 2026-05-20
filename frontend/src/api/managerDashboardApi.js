import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerDashboard = () => api.get('/manager/dashboard').then((res) => withData(res.data))
export const getManagerRecentActivities = () => api.get('/manager/dashboard/recent-activities').then((res) => withData(res.data))
