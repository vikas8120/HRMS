import api from './axios'

export const listSystemSettings = () => api.get('/super-admin/system-settings').then((r) => r.data)
export const saveSystemSetting = (payload) => api.put('/super-admin/system-settings', payload).then((r) => r.data)
