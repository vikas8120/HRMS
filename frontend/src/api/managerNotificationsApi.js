import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerNotifications = (params = {}) =>
  api.get('/manager/notifications', { params }).then((res) => withData(res.data))

export const createManagerNotification = (payload) =>
  api.post('/manager/notifications', payload).then((res) => withData(res.data))

export const markManagerNotificationRead = (notificationId) =>
  api.put(`/manager/notifications/${notificationId}/read`).then((res) => withData(res.data))

export const markAllManagerNotificationsRead = () =>
  api.put('/manager/notifications/mark-all-read').then((res) => withData(res.data))

export const deleteManagerNotification = (notificationId) =>
  api.delete(`/manager/notifications/${notificationId}`).then((res) => withData(res.data))
