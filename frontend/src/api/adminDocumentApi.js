import api from './axios'

export const listDocuments = (params) => api.get('/admin/documents', { params }).then((r) => r.data)
export const createDocument = (payload) => api.post('/admin/documents', payload).then((r) => r.data)
export const updateDocument = (id, payload) => api.put(`/admin/documents/${id}`, payload).then((r) => r.data)
export const deleteDocument = (id) => api.delete(`/admin/documents/${id}`).then((r) => r.data)
export const archiveDocument = (id) => api.patch(`/admin/documents/${id}/archive`).then((r) => r.data)
export const verifyDocument = (id) => api.patch(`/admin/documents/${id}/verify`).then((r) => r.data)
export const uploadDocumentFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/admin/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data)
}
