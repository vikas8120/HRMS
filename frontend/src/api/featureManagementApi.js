import api from './axios'

export const getFeatureFlags = () =>
  api.get('/super-admin/feature-management').then((res) => res.data)

export const updateFeatureFlags = (value) =>
  api.put('/super-admin/feature-management', { value }).then((res) => res.data)

