import { createCompatModel } from '../config/pgCompat.js'

const AutomationRule = createCompatModel('AutomationRule', { defaults: () => ({ enabled: true }) })

export default AutomationRule
