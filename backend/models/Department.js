import { createCompatModel } from '../config/pgCompat.js'

const Department = createCompatModel('Department', {
  refs: {
    companyId: 'TenantCompany',
    departmentHead: 'User'
  },
  defaults: () => ({
    description: '',
    departmentHead: null,
    status: 'active'
  })
})

export default Department
