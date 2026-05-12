import { createCompatModel } from '../config/pgCompat.js'

const BackupLog = createCompatModel('BackupLog', { defaults: () => ({ mode: 'manual', target: '', encryption: false, cloudProvider: '', status: 'queued', details: '', createdBy: 'Super Admin', dateTime: new Date().toISOString() }) })

export default BackupLog
