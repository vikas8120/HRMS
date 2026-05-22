import api from './axios'

export const getEmployeeAnnouncements = (params = {}) =>
  api.get('/employee/announcements', { params }).then((res) => res.data)

export const getEmployeeAnnouncementById = (id) =>
  api.get(`/employee/announcements/${id}`).then((res) => res.data)

export const markEmployeeAnnouncementRead = (id) =>
  api.patch(`/employee/announcements/${id}/read`).then((res) => res.data)

export const downloadAnnouncementAttachment = (item) => {
  const url = String(item?.attachmentUrl || '').trim()
  if (!url) return false

  const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:5001'
  const origin = apiRoot.replace(/\/$/, '')
  const href = /^https?:\/\//i.test(url) ? url : `${origin}${url}`

  const link = document.createElement('a')
  link.href = href
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.download = item?.attachmentName || 'attachment'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}
