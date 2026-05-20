import { createCompatModel } from '../config/pgCompat.js'

const ManagerMessageThread = createCompatModel('ManagerMessageThread', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User'
  },
  defaults: () => ({
    threadType: 'team',
    participants: [],
    subject: '',
    messages: [],
    unreadBy: {},
    archived: false
  })
})

export default ManagerMessageThread
