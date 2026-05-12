import { createCompatModel } from '../config/pgCompat.js'

const AIUsageLog = createCompatModel('AIUsageLog', { defaults: () => ({ usageCount: 1, actor: 'system', metadata: {}, dateTime: new Date().toISOString() }) })

export default AIUsageLog
