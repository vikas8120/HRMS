import { createCompatModel } from '../config/pgCompat.js'

const AuditLog = createCompatModel('AuditLog', { defaults: () => ({ actorType: 'system', actorName: '', module: '', description: '', ipAddress: '', device: '', metadata: {}, dateTime: new Date().toISOString() }) })

export default AuditLog
