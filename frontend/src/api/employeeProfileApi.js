import api from './axios'

export const getEmployeeProfile = () =>
  api.get('/employee/profile').then((res) => res.data)

export const updateEmployeeProfile = (payload) =>
  api.put('/employee/profile', payload).then((res) => res.data)

export const changeEmployeePassword = (payload) =>
  api.put('/employee/profile/change-password', payload).then((res) => res.data)
