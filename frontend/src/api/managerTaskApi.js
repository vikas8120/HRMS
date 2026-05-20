import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const createManagerTask = (payload) => api.post('/manager/tasks', payload).then((res) => withData(res.data))
export const getManagerTasks = (params = {}) => api.get('/manager/tasks', { params }).then((res) => withData(res.data))
export const getManagerTaskById = (taskId) => api.get(`/manager/tasks/${taskId}`).then((res) => withData(res.data))
export const updateManagerTask = (taskId, payload) => api.put(`/manager/tasks/${taskId}`, payload).then((res) => withData(res.data))
export const deleteManagerTask = (taskId) => api.delete(`/manager/tasks/${taskId}`).then((res) => withData(res.data))
export const addManagerTaskComment = (taskId, comment) => api.post(`/manager/tasks/${taskId}/comments`, { comment }).then((res) => withData(res.data))
export const updateManagerTaskStatus = (taskId, status) => api.put(`/manager/tasks/${taskId}/status`, { status }).then((res) => withData(res.data))
export const reassignManagerTask = (taskId, assignedEmployeeId) =>
  api.put(`/manager/tasks/${taskId}/reassign`, { assignedEmployeeId }).then((res) => withData(res.data))
