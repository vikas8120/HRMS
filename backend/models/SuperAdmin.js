import { createCompatModel } from '../config/pgCompat.js'

const SuperAdmin = createCompatModel('SuperAdmin', { defaults: () => ({ role: 'SUPER_ADMIN', status: 'active', lastLogin: null }) })

export default SuperAdmin
