import { createCompatModel } from '../config/pgCompat.js'

const AdminActivityLog = createCompatModel('AdminActivityLog', { refs: { admin: 'CompanyAdmin', performedBy: 'SuperAdmin' }, defaults: () => ({ dateTime: new Date().toISOString() }) })

export default AdminActivityLog
