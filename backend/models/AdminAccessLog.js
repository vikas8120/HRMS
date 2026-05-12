import { createCompatModel } from '../config/pgCompat.js'

const AdminAccessLog = createCompatModel('AdminAccessLog', { refs: { admin: 'CompanyAdmin' }, defaults: () => ({ ipAddress: '', device: '', action: 'login', dateTime: new Date().toISOString() }) })

export default AdminAccessLog
