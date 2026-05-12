import asyncHandler from '../utils/asyncHandler.js'
import ReportRun from '../models/ReportRun.js'

export const listReportRuns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, reportType = 'all' } = req.query
  const query = reportType === 'all' ? {} : { reportType }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    ReportRun.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    ReportRun.countDocuments(query)
  ])
  res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

export const generateReport = asyncHandler(async (req, res) => {
  const { reportType, fromDate, toDate, format = 'csv', filters = {} } = req.body
  if (!reportType || !fromDate || !toDate) return res.status(400).json({ message: 'reportType, fromDate and toDate are required' })

  const item = await ReportRun.create({
    reportType,
    fromDate,
    toDate,
    format,
    filters,
    resultSummary: `${reportType} generated in ${format.toUpperCase()} format`
  })

  res.status(201).json({ item, downloadUrl: `/mock-downloads/${item._id}.${format}`, message: 'Report generated successfully (mock export)' })
})
