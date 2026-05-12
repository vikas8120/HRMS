import { createCompatModel } from '../config/pgCompat.js'

const IntegrationSetting = createCompatModel('IntegrationSetting', { defaults: () => ({ category: 'general', connected: false, status: 'disconnected', config: {}, lastTestAt: null, lastTestStatus: 'not_tested' }) })

export default IntegrationSetting
