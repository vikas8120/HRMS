import { createCompatModel } from '../config/pgCompat.js'

const ManagerDocumentRequest = createCompatModel('ManagerDocumentRequest', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User',
    employeeId: 'User'
  },
  defaults: () => ({
    employeeId: null,
    title: '',
    description: '',
    requiredBy: null,
    status: 'pending',
    comments: []
  })
})

export default ManagerDocumentRequest
