import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerDocuments = (params = {}) =>
  api.get('/manager/documents', { params }).then((res) => withData(res.data))

export const getManagerMyDocuments = (params = {}) =>
  api.get('/manager/documents', { params: { ...params, scope: 'my' } }).then((res) => withData(res.data))

export const uploadManagerDocument = (formData) =>
  api.post('/manager/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => withData(res.data))

export const uploadManagerMyDocument = (formData) => {
  formData.append('scope', 'my')
  return api.post('/manager/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => withData(res.data))
}

export const getManagerDocumentById = (documentId) =>
  api.get(`/manager/documents/${documentId}`).then((res) => withData(res.data))

export const deleteManagerDocument = (documentId) =>
  api.delete(`/manager/documents/${documentId}`).then((res) => withData(res.data))

export const createManagerDocumentRequest = (payload) =>
  api.post('/manager/documents/request', payload).then((res) => withData(res.data))

export const getManagerDocumentRequests = (params = {}) =>
  api.get('/manager/documents/requests', { params }).then((res) => withData(res.data))
