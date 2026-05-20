import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerLeaves = (params = {}) =>
  api.get('/manager/leaves', { params }).then((res) => withData(res.data))

export const getManagerPendingLeaves = (params = {}) =>
  api.get('/manager/leaves/pending', { params }).then((res) => withData(res.data))

export const getManagerLeaveById = (leaveId) =>
  api.get(`/manager/leaves/${leaveId}`).then((res) => withData(res.data))

export const getMyManagerLeaves = (params = {}) =>
  api.get('/manager/leaves/my', { params }).then((res) => withData(res.data))

export const applyManagerLeave = (payload) =>
  api.post('/manager/leaves/apply', payload).then((res) => withData(res.data))

export const approveManagerLeave = (leaveId) =>
  api.put(`/manager/leaves/${leaveId}/approve`).then((res) => withData(res.data))

export const rejectManagerLeave = (leaveId, rejectionReason) =>
  api.put(`/manager/leaves/${leaveId}/reject`, { rejectionReason }).then((res) => withData(res.data))
