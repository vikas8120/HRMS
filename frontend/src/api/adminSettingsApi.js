import api from './axios'

export const getAdminSettings = () => api.get('/admin/settings').then((r) => r.data)

export const updateCompanyProfile = (payload) => api.put('/admin/settings/company-profile', payload).then((r) => r.data)
export const updateOfficeTiming = (payload) => api.put('/admin/settings/office-timing', payload).then((r) => r.data)
export const updateWorkingDays = (workingDays) => api.put('/admin/settings/working-days', { workingDays }).then((r) => r.data)
export const updateAttendanceRules = (payload) => api.put('/admin/settings/attendance-rules', payload).then((r) => r.data)
export const updateLeavePolicy = (payload) => api.put('/admin/settings/leave-policy', payload).then((r) => r.data)
export const updatePayrollSettings = (payload) => api.put('/admin/settings/payroll', payload).then((r) => r.data)
export const addHoliday = (payload) => api.post('/admin/settings/holidays', payload).then((r) => r.data)
export const deleteHoliday = (id) => api.delete(`/admin/settings/holidays/${id}`).then((r) => r.data)
