import { createCompatModel } from '../config/pgCompat.js'

const SecuritySetting = createCompatModel('SecuritySetting', { defaults: () => ({ value: null, description: '' }) })

export default SecuritySetting
