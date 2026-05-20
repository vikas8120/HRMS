import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const createManagerPerformanceReview = (payload) =>
  api.post('/manager/performance', payload).then((res) => withData(res.data))

export const getManagerPerformanceReviews = (params = {}) =>
  api.get('/manager/performance', { params }).then((res) => withData(res.data))

export const getManagerPerformanceByEmployee = (employeeId) =>
  api.get(`/manager/performance/${employeeId}`).then((res) => withData(res.data))

export const updateManagerPerformanceReview = (reviewId, payload) =>
  api.put(`/manager/performance/${reviewId}`, payload).then((res) => withData(res.data))

export const deleteManagerPerformanceReview = (reviewId) =>
  api.delete(`/manager/performance/${reviewId}`).then((res) => withData(res.data))

export const getManagerPerformanceDashboard = () =>
  api.get('/manager/performance/dashboard').then((res) => withData(res.data))
