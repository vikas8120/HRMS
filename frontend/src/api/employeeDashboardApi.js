import api from './axios'

export const getEmployeeDashboard = async () => {
  const response = await api.get('/employee/dashboard')
  return response?.data || {}
}
