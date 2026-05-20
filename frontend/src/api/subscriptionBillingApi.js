import api from './axios'

const q = (params) => ({ params })

export const listPlans = (params) => api.get('/super-admin/subscription-plans', q(params)).then((r) => r.data)
export const createPlan = (payload) => api.post('/super-admin/subscription-plans', payload).then((r) => r.data)
export const updatePlan = (id, payload) => api.put(`/super-admin/subscription-plans/${id}`, payload).then((r) => r.data)
export const deletePlan = (id) => api.delete(`/super-admin/subscription-plans/${id}`).then((r) => r.data)

export const listSubscriptions = (params) => api.get('/super-admin/subscriptions', q(params)).then((r) => r.data)
export const createSubscription = (payload) => api.post('/super-admin/subscriptions', payload).then((r) => r.data)
export const updateSubscription = (id, payload) => api.put(`/super-admin/subscriptions/${id}`, payload).then((r) => r.data)
export const deleteSubscription = (id) => api.delete(`/super-admin/subscriptions/${id}`).then((r) => r.data)
export const upgradeDowngrade = (id, payload) => api.patch(`/super-admin/subscriptions/${id}/upgrade-downgrade`, payload).then((r) => r.data)
export const setAutoRenewal = (id, autoRenewal) => api.patch(`/super-admin/subscriptions/${id}/auto-renewal`, { autoRenewal }).then((r) => r.data)

export const listInvoices = (params) => api.get('/super-admin/invoices', q(params)).then((r) => r.data)
export const createInvoice = (payload) => api.post('/super-admin/invoices', payload).then((r) => r.data)
export const generateInvoice = (payload) => api.post('/super-admin/invoices/generate', payload).then((r) => r.data)
export const updateInvoice = (id, payload) => api.put(`/super-admin/invoices/${id}`, payload).then((r) => r.data)
export const deleteInvoice = (id) => api.delete(`/super-admin/invoices/${id}`).then((r) => r.data)

export const listPayments = (params) => api.get('/super-admin/payments', q(params)).then((r) => r.data)
export const createPayment = (payload) => api.post('/super-admin/payments', payload).then((r) => r.data)
export const updatePayment = (id, payload) => api.put(`/super-admin/payments/${id}`, payload).then((r) => r.data)
export const deletePayment = (id) => api.delete(`/super-admin/payments/${id}`).then((r) => r.data)
export const refundPayment = (id) => api.patch(`/super-admin/payments/${id}/refund`).then((r) => r.data)

export const listCoupons = (params) => api.get('/super-admin/coupons', q(params)).then((r) => r.data)
export const createCoupon = (payload) => api.post('/super-admin/coupons', payload).then((r) => r.data)
export const updateCoupon = (id, payload) => api.put(`/super-admin/coupons/${id}`, payload).then((r) => r.data)
export const deleteCoupon = (id) => api.delete(`/super-admin/coupons/${id}`).then((r) => r.data)

export const listAddons = (params) => api.get('/super-admin/addons', q(params)).then((r) => r.data)
export const createAddon = (payload) => api.post('/super-admin/addons', payload).then((r) => r.data)
export const updateAddon = (id, payload) => api.put(`/super-admin/addons/${id}`, payload).then((r) => r.data)
export const deleteAddon = (id) => api.delete(`/super-admin/addons/${id}`).then((r) => r.data)
