import api from './axios'

export const getHrDashboard = () => api.get('/hr/dashboard').then((r) => r.data)

