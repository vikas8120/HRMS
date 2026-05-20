import api from './axios'

export const getEmployeeNotifications = (params = {}) =>
  api.get('/employee/notifications', { params }).then((res) => res.data)

export const markEmployeeNotificationRead = (id) =>
  api.patch(`/employee/notifications/${id}/read`).then((res) => res.data)

export const markAllEmployeeNotificationsRead = () =>
  api.patch('/employee/notifications/read-all').then((res) => res.data)

export const deleteEmployeeNotification = (id) =>
  api.delete(`/employee/notifications/${id}`).then((res) => res.data)
