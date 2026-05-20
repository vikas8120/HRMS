import { createCompatModel } from '../config/pgCompat.js'

const ManagerAnnouncement = createCompatModel('ManagerAnnouncement', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User'
  },
  defaults: () => ({
    title: '',
    message: '',
    participants: [],
    attachments: [],
    status: 'published',
    archived: false
  })
})

export default ManagerAnnouncement
