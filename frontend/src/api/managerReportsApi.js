import api from './axios'

export const getManagerAttendanceReport = (params = {}) =>
  api.get('/manager/reports/attendance', { params }).then((res) => res.data)

export const getManagerLeaveReport = (params = {}) =>
  api.get('/manager/reports/leaves', { params }).then((res) => res.data)

export const getManagerTaskReport = (params = {}) =>
  api.get('/manager/reports/tasks', { params }).then((res) => res.data)

export const getManagerPerformanceReport = (params = {}) =>
  api.get('/manager/reports/performance', { params }).then((res) => res.data)

export const getManagerCustomReport = (payload) =>
  api.post('/manager/reports/custom', payload).then((res) => res.data)

export const exportManagerReportPdf = (params = {}) =>
  api.get('/manager/reports/export/pdf', { params, responseType: 'blob' }).then((res) => res.data)

export const exportManagerReportExcel = (params = {}) =>
  api.get('/manager/reports/export/excel', { params, responseType: 'blob' }).then((res) => res.data)
