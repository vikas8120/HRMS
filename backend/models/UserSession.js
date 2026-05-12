import { createCompatModel } from '../config/pgCompat.js'

const UserSession = createCompatModel('UserSession', { refs: { user: 'GlobalUser' }, defaults: () => ({ ipAddress: '', device: '', active: true, loggedInAt: new Date().toISOString(), loggedOutAt: null }) })

export default UserSession
