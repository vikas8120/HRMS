import { createCompatModel } from '../config/pgCompat.js'

const Attendance = createCompatModel('Attendance', {
  refs: {
    companyId: 'TenantCompany',
    userId: 'User'
  },
  defaults: () => ({
    checkIn: null,
    checkOut: null,
    status: 'present',
    notes: ''
  })
})

export default Attendance
