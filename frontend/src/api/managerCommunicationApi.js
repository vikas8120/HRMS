import api from './axios'

export const createManagerMessage = (payload) =>
  api.post('/manager/messages', payload).then((res) => res.data)

export const getManagerMessages = (params = {}) =>
  api.get('/manager/messages', { params }).then((res) => res.data)

export const getManagerMessageThreadById = (threadId) =>
  api.get(`/manager/messages/${threadId}`).then((res) => res.data)

export const replyManagerMessageThread = (threadId, payload) =>
  api.post(`/manager/messages/${threadId}/reply`, payload).then((res) => res.data)

export const deleteManagerMessage = (messageId) =>
  api.delete(`/manager/messages/${messageId}`).then((res) => res.data)

export const createManagerAnnouncement = (payload) =>
  api.post('/manager/announcements', payload).then((res) => res.data)

export const getManagerAnnouncements = () =>
  api.get('/manager/announcements').then((res) => res.data)

export const updateManagerAnnouncement = (announcementId, payload) =>
  api.put(`/manager/announcements/${announcementId}`, payload).then((res) => res.data)

export const deleteManagerAnnouncement = (announcementId) =>
  api.delete(`/manager/announcements/${announcementId}`).then((res) => res.data)
