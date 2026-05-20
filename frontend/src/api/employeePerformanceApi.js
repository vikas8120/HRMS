import api from './axios'

export const getEmployeePerformanceOverview = () =>
  api.get('/employee/performance').then((res) => res.data)

export const getEmployeePerformanceGoals = () =>
  api.get('/employee/performance/goals').then((res) => res.data)

export const getEmployeePerformanceGoalById = (id) =>
  api.get(`/employee/performance/goals/${id}`).then((res) => res.data)

export const updateEmployeeGoalProgress = (id, payload) =>
  api.patch(`/employee/performance/goals/${id}/progress`, payload).then((res) => res.data)

export const getEmployeePerformanceFeedback = () =>
  api.get('/employee/performance/feedback').then((res) => res.data)

export const getEmployeeAppraisalHistory = () =>
  api.get('/employee/performance/appraisals').then((res) => res.data)

export const submitEmployeeSelfReview = (payload) =>
  api.post('/employee/performance/self-review', payload).then((res) => res.data)

export const downloadEmployeePerformanceReport = async () => {
  const response = await api.get('/employee/performance/report', { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `performance-report-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return { success: true }
}
