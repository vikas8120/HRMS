import { createCompatModel } from '../config/pgCompat.js'

const CompanySettings = createCompatModel('CompanySettings', {
  refs: {
    companyId: 'TenantCompany'
  },
  defaults: () => ({
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    attendancePolicy: {
      workHoursPerDay: 8,
      graceMinutes: 15
    },
    leavePolicy: {
      casual: 12,
      sick: 12,
      earned: 15
    },
    payrollPolicy: {
      payDay: 30,
      pfEnabled: false,
      esiEnabled: false
    }
  })
})

export default CompanySettings
