import { createCompatModel } from '../config/pgCompat.js'

const EmployeeDocument = createCompatModel('EmployeeDocument', {
  refs: {
    companyId: 'TenantCompany',
    employeeId: 'User',
    createdBy: 'User',
    verifiedBy: 'User'
  },
  defaults: () => ({
    title: '',
    employeeId: null,
    category: 'other',
    documentNumber: '',
    fileUrl: '',
    notes: '',
    issueDate: null,
    expiryDate: null,
    status: 'active',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
    archived: false,
    createdBy: null,
    visibility: 'team',
    ownerUserId: null
  })
})

export default EmployeeDocument
