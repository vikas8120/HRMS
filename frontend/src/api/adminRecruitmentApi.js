import api from './axios'

export const listRecruitmentCandidates = (params) => api.get('/admin/recruitment', { params }).then((r) => r.data)
export const createRecruitmentCandidate = (payload) => api.post('/admin/recruitment', payload).then((r) => r.data)
export const updateRecruitmentCandidate = (id, payload) => api.put(`/admin/recruitment/${id}`, payload).then((r) => r.data)
export const deleteRecruitmentCandidate = (id) => api.delete(`/admin/recruitment/${id}`).then((r) => r.data)
export const archiveRecruitmentCandidate = (id) => api.patch(`/admin/recruitment/${id}/archive`).then((r) => r.data)
