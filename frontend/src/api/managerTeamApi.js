import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const getManagerTeam = (params = {}) =>
  api.get('/manager/team', { params }).then((res) => withData(res.data))

export const getManagerTeamMemberById = (employeeId) =>
  api.get(`/manager/team/${employeeId}`).then((res) => withData(res.data))

export const getManagerTeamMemberDetails = (employeeId) =>
  api.get(`/manager/team/${employeeId}/details`).then((res) => withData(res.data))
