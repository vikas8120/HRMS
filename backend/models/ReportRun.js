import { createCompatModel } from '../config/pgCompat.js'

const ReportRun = createCompatModel('ReportRun', { defaults: () => ({ format: 'csv', filters: {}, generatedBy: 'Super Admin', resultSummary: '', dateTime: new Date().toISOString() }) })

export default ReportRun
