import api from './axios'

export const getEmployeeLeaves = (params = {}) =>
  api.get('/employee/leaves', { params }).then((res) => res.data)

export const applyEmployeeLeave = (payload) =>
  api.post('/employee/leaves', payload).then((res) => res.data)

export const getEmployeeLeaveById = (id) =>
  api.get(`/employee/leaves/${id}`).then((res) => res.data)

export const updateEmployeeLeave = (id, payload) =>
  api.put(`/employee/leaves/${id}`, payload).then((res) => res.data)

export const cancelEmployeeLeave = (id) =>
  api.delete(`/employee/leaves/${id}`).then((res) => res.data)

export const getEmployeeLeaveBalance = () =>
  api.get('/employee/leaves/balance').then((res) => res.data)

export const getEmployeeLeavePolicy = () =>
  api.get('/employee/leaves/policy').then((res) => res.data)
