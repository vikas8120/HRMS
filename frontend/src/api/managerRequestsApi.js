import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const createManagerRequest = (payload) =>
  api.post('/manager/requests', payload).then((res) => withData(res.data))

export const getManagerRequests = (params = {}) =>
  api.get('/manager/requests', { params }).then((res) => withData(res.data))

export const getManagerRequestById = (requestId) =>
  api.get(`/manager/requests/${requestId}`).then((res) => withData(res.data))

export const updateManagerRequest = (requestId, payload) =>
  api.put(`/manager/requests/${requestId}`, payload).then((res) => withData(res.data))

export const deleteManagerRequest = (requestId) =>
  api.delete(`/manager/requests/${requestId}`).then((res) => withData(res.data))

export const addManagerRequestComment = (requestId, comment) =>
  api.post(`/manager/requests/${requestId}/comments`, { comment }).then((res) => withData(res.data))

export const uploadManagerRequestDocument = (requestId, payload) =>
  api.post(`/manager/requests/${requestId}/upload`, payload, payload instanceof FormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : undefined).then((res) => withData(res.data))

export const closeManagerRequest = (requestId) =>
  api.put(`/manager/requests/${requestId}/close`).then((res) => withData(res.data))
