import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Task from '../models/Task.js'
import PerformanceReview from '../models/PerformanceReview.js'
import PDFDocument from 'pdfkit'

const toDateKey = (value) => String(value || '').slice(0, 10)

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)

  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email departmentId designation')
  const keySet = new Set()
  const employeeMap = {}

  for (const emp of team) {
    const row = {
      id: String(emp._id),
      employeeId: String(emp.employeeId || emp._id),
      name: emp.name || '-',
      email: emp.email || '-',
      departmentId: emp.departmentId || null,
      designation: emp.designation || '-'
    }
    keySet.add(row.id)
    keySet.add(row.employeeId)
    employeeMap[row.id] = row
    employeeMap[row.employeeId] = row
  }

  return { companyId, managerId, keySet, employeeMap, team }
}

const inRange = (dateValue, from, to) => {
  const key = toDateKey(dateValue)
  if (!key) return false
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}

const filterCommon = (rows, { employeeId = 'all', departmentId = 'all', status = 'all', month = '', from = '', to = '' }) => {
  return rows.filter((row) => {
    if (employeeId !== 'all' && String(row.employeeId || '') !== String(employeeId)) return false
    if (departmentId !== 'all' && String(row.departmentId || '') !== String(departmentId)) return false
    if (status !== 'all' && String(row.status || '').toLowerCase() !== String(status).toLowerCase()) return false
    if (month) {
      const monthKey = String(month).slice(0, 7)
      if (!String(row.date || row.startDate || row.reviewDate || row.deadline || '').startsWith(monthKey)) return false
    }
    if (from || to) {
      const dateLike = row.date || row.startDate || row.reviewDate || row.deadline
      if (!inRange(dateLike, from, to)) return false
    }
    return true
  })
}

const asCsv = (rows, fields) => {
  const headers = fields
  const lines = rows.map((row) => fields.map((field) => row[field] ?? ''))
  return [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

const buildPdfBuffer = (title, rows, fields) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 36, size: 'A4' })
  const chunks = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => resolve(Buffer.concat(chunks)))
  doc.on('error', reject)

  doc.fontSize(16).text(title)
  doc.moveDown(0.4)
  doc.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toISOString()}`)
  doc.moveDown()

  if (!rows.length || !fields.length) {
    doc.fontSize(12).fillColor('#111').text('No report data found for selected filters.')
    doc.end()
    return
  }

  rows.forEach((row, index) => {
    const line = `${index + 1}. ${fields.map((field) => `${field}: ${row[field] ?? '-'}`).join(' | ')}`
    doc.fontSize(10).fillColor('#111').text(line, { lineGap: 2 })
    doc.moveDown(0.25)
  })

  doc.end()
})

const getAttendanceRows = async (req) => {
  const { companyId, keySet, employeeMap } = await buildTeamScope(req)
  const items = await Attendance.find({ companyId }).sort({ date: -1, createdAt: -1 })
  const rows = items
    .filter((item) => keySet.has(String(item.employeeId || item.userId || '')))
    .map((item) => {
      const emp = employeeMap[String(item.employeeId || item.userId || '')] || {}
      return {
        id: item._id,
        employeeId: emp.employeeId || item.employeeId || item.userId || null,
        employeeName: emp.name || '-',
        departmentId: emp.departmentId || null,
        designation: emp.designation || '-',
        date: item.date || null,
        checkIn: item.checkIn || null,
        checkOut: item.checkOut || null,
        workingHours: Number(item.workingHours || 0),
        status: item.status || 'present'
      }
    })

  return filterCommon(rows, req.query)
}

const getLeaveRows = async (req) => {
  const { companyId, keySet, employeeMap } = await buildTeamScope(req)
  const items = await Leave.find({ companyId }).sort({ createdAt: -1 })
  const rows = items
    .filter((item) => keySet.has(String(item.employeeId || '')))
    .map((item) => {
      const emp = employeeMap[String(item.employeeId || '')] || {}
      return {
        id: item._id,
        employeeId: emp.employeeId || item.employeeId || null,
        employeeName: emp.name || '-',
        departmentId: emp.departmentId || null,
        designation: emp.designation || '-',
        leaveType: item.leaveType || 'casual',
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        totalDays: Number(item.totalDays || 0),
        reason: item.reason || '',
        status: item.status || 'pending',
        appliedDate: item.createdAt || null
      }
    })

  return filterCommon(rows, req.query)
}

const getTaskRows = async (req) => {
  const { companyId, managerId, keySet, employeeMap } = await buildTeamScope(req)
  const items = await Task.find({ companyId, assignedBy: managerId }).sort({ createdAt: -1 })
  const rows = items
    .filter((item) => keySet.has(String(item.employeeId || '')))
    .map((item) => {
      const emp = employeeMap[String(item.employeeId || '')] || {}
      return {
        id: item._id,
        employeeId: emp.employeeId || item.employeeId || null,
        employeeName: emp.name || '-',
        departmentId: emp.departmentId || null,
        designation: emp.designation || '-',
        title: item.title || '',
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        startDate: item.startDate || null,
        deadline: item.deadline || item.dueDate || null
      }
    })

  return filterCommon(rows, req.query)
}

const getPerformanceRows = async (req) => {
  const { companyId, managerId, keySet, employeeMap } = await buildTeamScope(req)
  const items = await PerformanceReview.find({ companyId, reviewerId: managerId, archived: false }).sort({ createdAt: -1 })
  const rows = items
    .filter((item) => keySet.has(String(item.employeeId || '')))
    .map((item) => {
      const emp = employeeMap[String(item.employeeId || '')] || {}
      return {
        id: item._id,
        employeeId: emp.employeeId || item.employeeId || null,
        employeeName: emp.name || '-',
        departmentId: emp.departmentId || null,
        designation: emp.designation || '-',
        reviewPeriod: item.reviewPeriod || item.cycle || 'monthly',
        rating: Number(item.finalScore || 0),
        taskScore: Number(item.taskScore || 0),
        attendanceScore: Number(item.attendanceScore || 0),
        behaviourScore: Number(item.behaviourScore || 0),
        productivityScore: Number(item.productivityScore || 0),
        status: item.status || 'draft',
        reviewDate: item.reviewDate || item.createdAt || null
      }
    })

  return filterCommon(rows, req.query)
}

export const getManagerAttendanceReport = asyncHandler(async (req, res) => {
  const data = await getAttendanceRows(req)
  res.status(200).json({ success: true, data })
})

export const getManagerLeaveReport = asyncHandler(async (req, res) => {
  const data = await getLeaveRows(req)
  res.status(200).json({ success: true, data })
})

export const getManagerTaskReport = asyncHandler(async (req, res) => {
  const data = await getTaskRows(req)
  res.status(200).json({ success: true, data })
})

export const getManagerPerformanceReport = asyncHandler(async (req, res) => {
  const data = await getPerformanceRows(req)
  res.status(200).json({ success: true, data })
})

export const getManagerCustomReport = asyncHandler(async (req, res) => {
  const { reportType = 'attendance', fields = [] } = req.body || {}
  const normalizedType = String(reportType).toLowerCase()
  let rows = []
  if (normalizedType === 'attendance') rows = await getAttendanceRows(req)
  if (normalizedType === 'leaves') rows = await getLeaveRows(req)
  if (normalizedType === 'tasks') rows = await getTaskRows(req)
  if (normalizedType === 'performance') rows = await getPerformanceRows(req)
  if (!rows.length) return res.status(200).json({ success: true, data: [], fields: [] })

  const availableFields = Object.keys(rows[0] || {})
  const selected = Array.isArray(fields) && fields.length ? fields.filter((f) => availableFields.includes(f)) : availableFields
  const projected = rows.map((row) => Object.fromEntries(selected.map((field) => [field, row[field]])))

  res.status(200).json({ success: true, data: projected, fields: selected, availableFields })
})

const resolveRowsByType = async (req, reportType) => {
  const type = String(reportType || '').toLowerCase()
  if (type === 'attendance') return getAttendanceRows(req)
  if (type === 'leaves') return getLeaveRows(req)
  if (type === 'tasks') return getTaskRows(req)
  if (type === 'performance') return getPerformanceRows(req)
  return []
}

export const exportManagerReportPdf = asyncHandler(async (req, res) => {
  const reportType = String(req.query.reportType || 'attendance')
  const fields = String(req.query.fields || '').split(',').map((x) => x.trim()).filter(Boolean)
  const rows = await resolveRowsByType(req, reportType)
  const effectiveFields = fields.length ? fields : Object.keys(rows[0] || {})
  const pdfBuffer = await buildPdfBuffer(`Manager ${reportType} report`, rows, effectiveFields)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=manager-${reportType}-report.pdf`)
  return res.status(200).send(pdfBuffer)
})

export const exportManagerReportExcel = asyncHandler(async (req, res) => {
  const reportType = String(req.query.reportType || 'attendance')
  const fields = String(req.query.fields || '').split(',').map((x) => x.trim()).filter(Boolean)
  const rows = await resolveRowsByType(req, reportType)
  const effectiveFields = fields.length ? fields : Object.keys(rows[0] || {})
  const csv = asCsv(rows, effectiveFields)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=manager-${reportType}-report.csv`)
  return res.status(200).send(csv)
})
