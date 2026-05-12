import { createCompatModel } from '../config/pgCompat.js'

const GlobalUser = createCompatModel('GlobalUser', { refs: { company: 'TenantCompany' }, defaults: () => ({ phone: '', status: 'active', role: 'EMPLOYEE', lastLogin: null }) })

export default GlobalUser
