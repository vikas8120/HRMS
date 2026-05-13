import asyncHandler from '../utils/asyncHandler.js'
import ReportRun from '../models/ReportRun.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

export const listReportRuns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, reportType = 'all' } = req.query
  const query = reportType === 'all' ? {} : { reportType }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    ReportRun.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    ReportRun.countDocuments(query)
  ])
  const pagination = { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
  respond(res, 200, 'Report runs fetched successfully', { items, pagination })
})

export const generateReport = asyncHandler(async (req, res) => {
  const { reportType, fromDate, toDate, format = 'csv', filters = {} } = req.body
  if (!reportType || !fromDate || !toDate) return respond(res, 400, 'Validation failed: reportType, fromDate and toDate are required')

  const item = await ReportRun.create({
    reportType,
    fromDate,
    toDate,
    format,
    filters,
    resultSummary: `${reportType} generated in ${format.toUpperCase()} format`
  })

  await AuditLog.create({
    category: 'Audit Reports',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'Platform Reports',
    action: 'GENERATE_REPORT',
    description: `Generated report: ${reportType}`,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata: { reportRunId: item._id, reportType, format }
  })

  respond(res, 201, 'Report generated successfully', { item, downloadUrl: `/mock-downloads/${item._id}.${format}` })
})
