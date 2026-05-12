import api from './axios'

export const listDashboardWidgets = (sectionKey, params) => api.get(`/super-admin/dashboard/widgets/${sectionKey}`, { params }).then((r) => r.data)
export const createDashboardWidget = (sectionKey, payload) => api.post(`/super-admin/dashboard/widgets/${sectionKey}`, payload).then((r) => r.data)
export const getDashboardWidgetById = (sectionKey, id) => api.get(`/super-admin/dashboard/widgets/${sectionKey}/${id}`).then((r) => r.data)
export const updateDashboardWidget = (sectionKey, id, payload) => api.put(`/super-admin/dashboard/widgets/${sectionKey}/${id}`, payload).then((r) => r.data)
export const deleteDashboardWidget = (sectionKey, id) => api.delete(`/super-admin/dashboard/widgets/${sectionKey}/${id}`).then((r) => r.data)
