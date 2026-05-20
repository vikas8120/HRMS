import api from './axios'

const withData = (payload) => payload?.data || payload || {}

export const createManagerMeeting = (payload) =>
  api.post('/manager/meetings', payload).then((res) => withData(res.data))

export const getManagerMeetings = (params = {}) =>
  api.get('/manager/meetings', { params }).then((res) => withData(res.data))

export const getManagerMeetingById = (meetingId) =>
  api.get(`/manager/meetings/${meetingId}`).then((res) => withData(res.data))

export const updateManagerMeeting = (meetingId, payload) =>
  api.put(`/manager/meetings/${meetingId}`, payload).then((res) => withData(res.data))

export const deleteManagerMeeting = (meetingId) =>
  api.delete(`/manager/meetings/${meetingId}`).then((res) => withData(res.data))

export const addManagerMeetingNotes = (meetingId, notes) =>
  api.post(`/manager/meetings/${meetingId}/notes`, { notes }).then((res) => withData(res.data))
