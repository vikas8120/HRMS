import { createCompatModel } from '../config/pgCompat.js'

const ActivityLog = createCompatModel('ActivityLog', {
  refs: {
    companyId: 'TenantCompany',
    userId: 'User'
  },
  defaults: () => ({
    module: '',
    action: '',
    message: '',
    metadata: {}
  })
})

export default ActivityLog
