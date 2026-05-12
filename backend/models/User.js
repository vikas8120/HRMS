import { createCompatModel } from '../config/pgCompat.js'

const User = createCompatModel('User', {
  refs: {
    companyId: 'TenantCompany',
    departmentId: 'Department',
    managerId: 'User'
  },
  defaults: () => ({
    role: 'employee',
    status: 'active',
    phone: '',
    departmentId: null,
    managerId: null,
    assignedEmployees: [],
    joiningDate: null,
    password: ''
  })
})

export default User
