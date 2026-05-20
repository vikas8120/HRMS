import api from './axios'

export const createManagerSupportTicket = (formData) =>
  api.post('/manager/support/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const getManagerSupportTickets = (params = {}) =>
  api.get('/manager/support/tickets', { params }).then((res) => res.data)

export const getManagerSupportTicketById = (ticketId) =>
  api.get(`/manager/support/tickets/${ticketId}`).then((res) => res.data)

export const replyManagerSupportTicket = (ticketId, formData) =>
  api.post(`/manager/support/tickets/${ticketId}/reply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res.data)

export const closeManagerSupportTicket = (ticketId) =>
  api.put(`/manager/support/tickets/${ticketId}/close`).then((res) => res.data)

export const getManagerSupportFaqs = () =>
  api.get('/manager/support/faqs').then((res) => res.data)
