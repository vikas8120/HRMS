import { createCompatModel } from '../config/pgCompat.js'

const CompanyAdmin = createCompatModel('CompanyAdmin', { refs: { assignedCompanies: 'TenantCompany' }, defaults: () => ({ role: 'COMPANY_ADMIN', assignedCompanies: [], status: 'active', lastLogin: null }) })

export default CompanyAdmin
