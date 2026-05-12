import { createCompatModel } from '../config/pgCompat.js'

const Leave = createCompatModel('Leave', {
  refs: {
    companyId: 'TenantCompany',
    employeeId: 'User',
    approvedBy: 'User'
  },
  defaults: () => ({
    leaveType: 'casual',
    startDate: null,
    endDate: null,
    totalDays: 0,
    reason: '',
    status: 'pending',
    approvedBy: null,
    rejectionReason: ''
  })
})

export default Leave
