import api from './axios'

export const getEmployeeDocuments = (params = {}) =>
  api.get('/employee/documents', { params }).then((res) => res.data)

export const uploadEmployeeDocument = (formData) =>
  api.post('/employee/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const getEmployeeDocumentById = (id) =>
  api.get(`/employee/documents/${id}`).then((res) => res.data)

export const updateEmployeeDocument = (id, formData) =>
  api.put(`/employee/documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const deleteEmployeeDocument = (id) =>
  api.delete(`/employee/documents/${id}`).then((res) => res.data)

export const downloadEmployeeDocument = async (doc) => {
  if (!doc?.fileUrl) return false
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const origin = base.endsWith('/api') ? base.slice(0, -4) : base
  const link = document.createElement('a')
  link.href = `${origin}${doc.fileUrl}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.download = doc.title ? `${doc.title}` : 'document'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}
