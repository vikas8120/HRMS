import { createCompatModel } from '../config/pgCompat.js'

const ManagerNotification = createCompatModel('ManagerNotification', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User'
  },
  defaults: () => ({
    category: 'system',
    type: 'system-update',
    title: '',
    message: '',
    sourceModule: '',
    sourceId: '',
    sourceKey: '',
    actionPath: '',
    actionType: 'view',
    metadata: {},
    isRead: false,
    readAt: null,
    isDeleted: false,
    deletedAt: null
  })
})

export default ManagerNotification
