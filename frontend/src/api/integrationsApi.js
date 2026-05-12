import api from './axios'

export const listIntegrations = () => api.get('/super-admin/integrations').then((r) => r.data)
export const createIntegration = (payload) => api.post('/super-admin/integrations', payload).then((r) => r.data)
export const updateIntegration = (id, payload) => api.put(`/super-admin/integrations/${id}`, payload).then((r) => r.data)
export const connectIntegration = (id, payload) => api.patch(`/super-admin/integrations/${id}/connect`, payload).then((r) => r.data)
export const disconnectIntegration = (id) => api.patch(`/super-admin/integrations/${id}/disconnect`).then((r) => r.data)
export const testIntegration = (id) => api.post(`/super-admin/integrations/${id}/test`).then((r) => r.data)
