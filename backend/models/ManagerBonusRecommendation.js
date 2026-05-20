import { createCompatModel } from '../config/pgCompat.js'

const ManagerBonusRecommendation = createCompatModel('ManagerBonusRecommendation', {
  refs: {
    companyId: 'TenantCompany',
    managerId: 'User',
    employeeId: 'User'
  },
  defaults: () => ({
    employeeId: null,
    recommendationType: 'bonus',
    amount: 0,
    reason: '',
    remarks: '',
    status: 'submitted'
  })
})

export default ManagerBonusRecommendation
