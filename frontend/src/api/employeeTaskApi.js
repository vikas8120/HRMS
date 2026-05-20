import api from './axios'

export const getEmployeeTasks = (params = {}) =>
  api.get('/employee/tasks', { params }).then((res) => res.data)

export const getEmployeeTaskById = (id) =>
  api.get(`/employee/tasks/${id}`).then((res) => res.data)

export const updateEmployeeTaskStatus = (id, status) =>
  api.patch(`/employee/tasks/${id}/status`, { status }).then((res) => res.data)

export const addEmployeeTaskComment = (id, payload) => {
  if (payload instanceof FormData) {
    return api.post(`/employee/tasks/${id}/comments`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data)
  }
  return api.post(`/employee/tasks/${id}/comments`, payload).then((res) => res.data)
}
