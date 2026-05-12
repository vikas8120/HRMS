import { createCompatModel } from '../config/pgCompat.js'

const SupportAgent = createCompatModel('SupportAgent', { defaults: () => ({ level: 'L1', active: true }) })

export default SupportAgent
