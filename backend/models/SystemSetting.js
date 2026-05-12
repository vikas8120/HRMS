import { createCompatModel } from '../config/pgCompat.js'

const SystemSetting = createCompatModel('SystemSetting', { defaults: () => ({ value: null, description: '' }) })

export default SystemSetting
