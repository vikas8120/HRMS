import api from './axios'

export const getManagerProfile = () =>
  api.get('/manager/profile').then((res) => res.data)

export const updateManagerProfile = (payload) =>
  api.put('/manager/profile', payload).then((res) => res.data)

export const uploadManagerProfileImage = (formData) =>
  api.post('/manager/profile/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const changeManagerPassword = (payload) =>
  api.put('/manager/profile/change-password', payload).then((res) => res.data)

export const getManagerLoginActivity = () =>
  api.get('/manager/profile/login-activity').then((res) => res.data)

export const logoutManagerOtherDevices = () =>
  api.post('/manager/profile/logout-other-devices').then((res) => res.data)
