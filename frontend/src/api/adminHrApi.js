import api from './axios'

const withLegacyData = (res) => {
  const data = res?.data
  return { ...res, data }
}

const withLegacyList = (res) => {
  const list = res?.data || res?.items || []
  return { ...res, data: list }
}

export const getHRList = (params) => api.get('/admin/hr', { params }).then((r) => withLegacyList(r.data))
export const createHR = (payload) => api.post('/admin/hr', payload).then((r) => withLegacyData(r.data))
export const updateHR = (id, payload) => api.put(`/admin/hr/${id}`, payload).then((r) => withLegacyData(r.data))
export const deleteHR = (id) => api.delete(`/admin/hr/${id}`).then((r) => withLegacyData(r.data))
export const updateHRStatus = (id, status) => api.patch(`/admin/hr/${id}/status`, { status }).then((r) => withLegacyData(r.data))
