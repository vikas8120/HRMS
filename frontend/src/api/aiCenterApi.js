import api from './axios'

export const getAIInsights = (module) => api.get('/super-admin/ai/insights', { params: { module } }).then((r) => r.data)
export const listAISettings = () => api.get('/super-admin/ai/settings').then((r) => r.data)
export const saveAISetting = (payload) => api.put('/super-admin/ai/settings', payload).then((r) => r.data)
export const listAIUsageLogs = (params) => api.get('/super-admin/ai/usage-logs', { params }).then((r) => r.data)
export const createAIUsageLog = (payload) => api.post('/super-admin/ai/usage-logs', payload).then((r) => r.data)
export const listAutomationRules = () => api.get('/super-admin/ai/automation-rules').then((r) => r.data)
export const createAutomationRule = (payload) => api.post('/super-admin/ai/automation-rules', payload).then((r) => r.data)
export const updateAutomationRule = (id, payload) => api.put(`/super-admin/ai/automation-rules/${id}`, payload).then((r) => r.data)
