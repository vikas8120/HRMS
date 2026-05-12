import { createCompatModel } from '../config/pgCompat.js'

const Payroll = createCompatModel('Payroll', {
  refs: {
    companyId: 'TenantCompany',
    employeeId: 'User',
    generatedBy: 'User'
  },
  defaults: () => ({
    employeeId: null,
    month: '',
    year: null,
    basicSalary: 0,
    hra: 0,
    allowances: 0,
    bonus: 0,
    deductions: 0,
    tax: 0,
    netSalary: 0,
    status: 'generated',
    generatedBy: null
  })
})

export default Payroll
