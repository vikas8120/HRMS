import api from './axios'

export const getEmployeeTickets = (params = {}) =>
  api.get('/employee/tickets', { params }).then((res) => res.data)

export const createEmployeeTicket = (formData) =>
  api.post('/employee/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const getEmployeeTicketById = (id) =>
  api.get(`/employee/tickets/${id}`).then((res) => res.data)

export const addEmployeeTicketMessage = (id, formData) =>
  api.post(`/employee/tickets/${id}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const closeEmployeeTicket = (id) =>
  api.patch(`/employee/tickets/${id}/close`).then((res) => res.data)

export const reopenEmployeeTicket = (id) =>
  api.patch(`/employee/tickets/${id}/reopen`).then((res) => res.data)

export const getEmployeeTicketCategories = () =>
  api.get('/employee/tickets/categories').then((res) => res.data)
