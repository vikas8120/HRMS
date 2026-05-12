import api from './api/axios'

export async function fetchModuleData(moduleName) {
  const response = await api.get('/ai-center/module', { params: { name: moduleName } })
  return response.data
}

export async function fetchDashboardSummary() {
  const response = await api.get('/ai-center/summary')
  return response.data
}
