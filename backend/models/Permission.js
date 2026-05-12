import { createCompatModel } from '../config/pgCompat.js'

const Permission = createCompatModel('Permission', { refs: { role: 'Role' }, defaults: () => ({ view: false, create: false, edit: false, delete: false, approve: false, export: false }) })

export default Permission
