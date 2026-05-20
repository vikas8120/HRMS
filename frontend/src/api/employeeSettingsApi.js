import api from './axios'

export const getEmployeeSettings = () =>
  api.get('/employee/settings').then((res) => res.data)

export const updateEmployeeSettings = (payload) =>
  api.put('/employee/settings', payload).then((res) => res.data)

export const changeEmployeeSettingsPassword = (payload) =>
  api.put('/employee/change-password', payload).then((res) => res.data)

export const logoutEmployeeOtherDevices = () =>
  api.post('/employee/settings/logout-other-devices').then((res) => res.data)
