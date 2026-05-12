import { createCompatModel } from '../config/pgCompat.js'

const LoginAttempt = createCompatModel('LoginAttempt', { refs: { user: 'GlobalUser' }, defaults: () => ({ ipAddress: '', device: '', success: false, reason: '', dateTime: new Date().toISOString() }) })

export default LoginAttempt
