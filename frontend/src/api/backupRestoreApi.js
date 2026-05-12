import api from './axios'

export const listBackupLogs = (params) => api.get('/super-admin/backup/logs', { params }).then((r) => r.data)
export const runBackup = (payload) => api.post('/super-admin/backup/run', payload).then((r) => r.data)
export const runRestore = (payload) => api.post('/super-admin/backup/restore', payload).then((r) => r.data)
