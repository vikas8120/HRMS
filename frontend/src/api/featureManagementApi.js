import api from './axios'

export const getFeatureFlags = (companyId = '') =>
  api.get('/super-admin/feature-management', { params: companyId ? { companyId } : {} }).then((res) => res.data)

export const updateFeatureFlags = (value, companyId = '') =>
  api.put('/super-admin/feature-management', companyId ? { value, companyId } : { value }).then((res) => res.data)
