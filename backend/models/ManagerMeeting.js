import { createCompatModel } from '../config/pgCompat.js'

const ManagerMeeting = createCompatModel('ManagerMeeting', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User'
  },
  defaults: () => ({
    title: '',
    date: null,
    startTime: '',
    endTime: '',
    participants: [],
    agenda: '',
    location: '',
    meetingLink: '',
    notes: [],
    status: 'scheduled',
    cancelledAt: null
  })
})

export default ManagerMeeting
