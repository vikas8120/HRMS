import { createCompatModel } from '../config/pgCompat.js'

const Role = createCompatModel('Role', { defaults: () => ({ description: '', permissions: [] }) })

export default Role
