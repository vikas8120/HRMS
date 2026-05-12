import { createCompatModel } from '../config/pgCompat.js'

const DeviceLog = createCompatModel('DeviceLog', { refs: { user: 'GlobalUser' }, defaults: () => ({ deviceId: '', deviceType: '', os: '', browser: '', ipAddress: '', dateTime: new Date().toISOString() }) })

export default DeviceLog
