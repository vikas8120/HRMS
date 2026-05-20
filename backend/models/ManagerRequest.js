import { createCompatModel } from '../config/pgCompat.js'

const ManagerRequest = createCompatModel('ManagerRequest', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User'
  },
  defaults: () => ({
    requestType: 'other',
    subject: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    raisedTo: 'hr_admin',
    comments: [],
    documents: [],
    timeline: [],
    closedAt: null
  })
})

export default ManagerRequest
