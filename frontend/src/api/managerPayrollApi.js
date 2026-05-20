import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerPayrollTeamSummary = (params = {}) =>
  api.get('/manager/payroll/team-summary', { params }).then((res) => withData(res.data))

export const getManagerPayrollStatus = (params = {}) =>
  api.get('/manager/payroll/status', { params }).then((res) => withData(res.data))

export const createManagerBonusRecommendation = (payload) =>
  api.post('/manager/payroll/bonus-recommendation', payload).then((res) => withData(res.data))
