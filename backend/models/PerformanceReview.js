import { createCompatModel } from '../config/pgCompat.js'

const PerformanceReview = createCompatModel('PerformanceReview', {
  refs: {
    companyId: 'TenantCompany',
    employeeId: 'User',
    reviewerId: 'User',
    createdBy: 'User'
  },
  defaults: () => ({
    cycle: '',
    employeeId: null,
    reviewerId: null,
    goal: '',
    selfScore: 0,
    managerScore: 0,
    finalScore: 0,
    status: 'draft',
    feedback: '',
    reviewDate: null,
    archived: false,
    createdBy: null
  })
})

export default PerformanceReview
