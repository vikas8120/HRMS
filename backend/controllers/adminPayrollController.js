import asyncHandler from '../utils/asyncHandler.js'
import Payroll from '../models/Payroll.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import Attendance from '../models/Attendance.js'
import CompanySettings from '../models/CompanySettings.js'

const ALLOWED_STATUS = new Set(['generated', 'paid', 'pending'])

const num = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const computeNet = ({ basicSalary, hra, allowances, bonus, deductions, tax }) =>
  num(basicSalary) + num(hra) + num(allowances) + num(bonus) - num(deductions) - num(tax)

const isValidMonth = (month) => /^\d{2}$/.test(String(month)) && Number(month) >= 1 && Number(month) <= 12
const isValidYear = (year) => Number.isFinite(Number(year)) && Number(year) >= 2000 && Number(year) <= 2100

const getMonthBounds = (year, month) => {
  const y = Number(year)
  const m = Number(month)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  return { start, end, daysInMonth: end.getUTCDate() }
}

const getAttendanceSummary = (rows = []) => {
  const summary = { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0 }
  for (const row of rows) {
    const key = String(row.status || '').toLowerCase()
    if (key === 'half-day') summary.halfDay += 1
    else if (Object.prototype.hasOwnProperty.call(summary, key)) summary[key] += 1
  }
  return summary
}

const serializePayroll = (item, employeeMap = {}) => ({
  id: item._id,
  employeeId: item.employeeId,
  employeeName: employeeMap[String(item.employeeId || '')]?.name || '-',
  departmentId: employeeMap[String(item.employeeId || '')]?.departmentId || null,
  companyId: item.companyId,
  month: item.month,
  year: Number(item.year || 0),
  basicSalary: num(item.basicSalary),
  hra: num(item.hra),
  allowances: num(item.allowances),
  bonus: num(item.bonus),
  deductions: num(item.deductions),
  tax: num(item.tax),
  netSalary: num(item.netSalary),
  workingDays: Number(item.workingDays || 0),
  attendanceDays: Number(item.attendanceDays || 0),
  attendanceDeduction: num(item.attendanceDeduction),
  status: item.status || 'generated',
  generatedBy: item.generatedBy || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const getEmployeeMap = async (companyId) => {
  const employees = await User.find({ companyId, role: 'employee' }).select('employeeId name departmentId status salary')
  return Object.fromEntries(
    employees.map((emp) => [String(emp.employeeId || emp._id), {
      name: emp.name || '-',
      departmentId: emp.departmentId || null,
      status: emp.status || 'active',
      salary: num(emp.salary)
    }])
  )
}

const resolveEmployeeKey = async (companyId, providedEmployeeId) => {
  const raw = String(providedEmployeeId || '').trim()
  if (!raw) return null

  const employee = await User.findOne({ companyId, role: 'employee', $or: [{ employeeId: raw }, { _id: raw }] })
  if (!employee) return null

  return String(employee.employeeId || employee._id)
}

const generatePdfBuffer = (title, lines = []) => {
  const safe = (value) => String(value).replace(/[()\\]/g, ' ')
  const contentLines = [title, ...lines].map((line, index) => `BT /F1 11 Tf 50 ${780 - (index * 16)} Td (${safe(line)}) Tj ET`).join('\n')
  const stream = `${contentLines}\n`
  const len = Buffer.byteLength(stream, 'utf8')

  const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length ${len} >> stream\n${stream}endstream endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000120 00000 n \n0000000247 00000 n \n0000000317 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${317 + len + 32}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

export const generatePayroll = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const {
    employeeId,
    month,
    year,
    hra = 0,
    allowances = 0,
    bonus = 0,
    deductions = 0,
    tax = 0,
    status = 'generated',
    updateExisting = true
  } = req.body

  if (!month || !year) {
    return res.status(400).json({ success: false, message: 'month and year are required' })
  }
  if (!isValidMonth(month) || !isValidYear(year)) {
    return res.status(400).json({ success: false, message: 'Invalid month/year' })
  }

  const normalizedStatus = String(status).toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payroll status' })
  }

  const employeeMap = await getEmployeeMap(companyId)

  let targetEmployeeIds = []
  if (employeeId) {
    const resolved = await resolveEmployeeKey(companyId, employeeId)
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Employee not found for this company' })
    }
    targetEmployeeIds = [resolved]
  } else {
    targetEmployeeIds = Object.entries(employeeMap)
      .filter(([, value]) => String(value.status).toLowerCase() === 'active')
      .map(([key]) => key)
  }

  if (targetEmployeeIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No active employees found for payroll generation' })
  }

  let settings = await CompanySettings.findOne({ companyId })
  if (!settings) settings = await CompanySettings.create({ companyId })
  const payrollSettings = settings.payrollSettings || settings.payrollPolicy || {}
  const attendancePolicy = settings.attendanceRules || settings.attendancePolicy || {}
  const {
    pfEnabled = false,
    pfPercent = 0,
    esiEnabled = false,
    esiPercent = 0
  } = payrollSettings
  const { absentDeductionPerDay = 1, halfDayWeight = 0.5 } = attendancePolicy
  const safeAbsentDeductionPerDay = Math.max(0, num(absentDeductionPerDay, 1))
  const safeHalfDayWeight = Math.max(0, Math.min(1, num(halfDayWeight, 0.5)))
  const safePfPercent = Math.max(0, num(pfPercent))
  const safeEsiPercent = Math.max(0, num(esiPercent))
  const { start, end, daysInMonth } = getMonthBounds(year, month)

  const allMonthAttendance = await Attendance.find({
    companyId,
    date: { $gte: start.toISOString().slice(0, 10), $lte: end.toISOString().slice(0, 10) }
  }).select('employeeId userId status date')
  const attendanceMap = {}
  for (const row of allMonthAttendance) {
    const key = String(row.employeeId || row.userId || '')
    if (!attendanceMap[key]) attendanceMap[key] = []
    attendanceMap[key].push(row)
  }

  const generated = []
  let createdCount = 0
  let updatedCount = 0
  const canUpdateExisting = updateExisting !== false
  for (const empId of targetEmployeeIds) {
    const basicSalary = num(employeeMap[empId]?.salary)
    const attendanceRows = attendanceMap[empId] || []
    const attSummary = getAttendanceSummary(attendanceRows)
    const attendanceDays = attSummary.present + attSummary.late + attSummary.leave + (attSummary.halfDay * safeHalfDayWeight)
    const absentEquivalentDays = attSummary.absent + (attSummary.halfDay * (1 - safeHalfDayWeight))
    const perDaySalary = daysInMonth > 0 ? basicSalary / daysInMonth : 0
    const attendanceDeduction = perDaySalary * absentEquivalentDays * safeAbsentDeductionPerDay
    const pfAmount = pfEnabled ? ((basicSalary * safePfPercent) / 100) : 0
    const esiAmount = esiEnabled ? ((basicSalary * safeEsiPercent) / 100) : 0
    const totalDeductions = num(deductions) + attendanceDeduction + pfAmount + esiAmount

    const existing = await Payroll.findOne({ companyId, employeeId: empId, month, year: Number(year) })
    if (existing) {
      if (!canUpdateExisting) {
        return res.status(409).json({
          success: false,
          message: `Payroll already exists for employee ${empId} (${month}-${year})`,
          details: { employeeId: empId, month, year: Number(year) }
        })
      }
      existing.basicSalary = basicSalary
      existing.hra = num(hra)
      existing.allowances = num(allowances)
      existing.bonus = num(bonus)
      existing.deductions = totalDeductions
      existing.tax = num(tax)
      existing.workingDays = daysInMonth
      existing.attendanceDays = Number(attendanceDays.toFixed(2))
      existing.attendanceDeduction = Number(attendanceDeduction.toFixed(2))
      existing.netSalary = computeNet(existing)
      existing.status = normalizedStatus
      existing.generatedBy = req.user.id
      await existing.save()
      generated.push(existing)
      updatedCount += 1
    } else {
      const item = await Payroll.create({
        companyId,
        employeeId: empId,
        month,
        year: Number(year),
        basicSalary,
        hra: num(hra),
        allowances: num(allowances),
        bonus: num(bonus),
        deductions: totalDeductions,
        tax: num(tax),
        workingDays: daysInMonth,
        attendanceDays: Number(attendanceDays.toFixed(2)),
        attendanceDeduction: Number(attendanceDeduction.toFixed(2)),
        netSalary: computeNet({ basicSalary, hra, allowances, bonus, deductions: totalDeductions, tax }),
        status: normalizedStatus,
        generatedBy: req.user.id
      })
      generated.push(item)
      createdCount += 1
    }
  }

  await ActivityLog.create({
    companyId,
    userId: req.user.id,
    module: 'payroll',
    action: 'payroll_generated',
    message: `Payroll generated for ${generated.length} employee(s) (${month}-${year}), created ${createdCount}, updated ${updatedCount}`,
    metadata: { month, year, totalEmployees: generated.length, createdCount, updatedCount, updateExisting: canUpdateExisting }
  })

  return res.status(201).json({
    success: true,
    message: `Payroll generated successfully (${createdCount} created, ${updatedCount} updated)`,
    data: generated.map((item) => serializePayroll(item, employeeMap)),
    items: generated.map((item) => serializePayroll(item, employeeMap))
  })
})

export const listPayroll = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const month = String(req.query.month || '').trim()
  const year = String(req.query.year || '').trim()
  const employeeId = String(req.query.employeeId || '').trim()
  const departmentId = String(req.query.departmentId || '').trim()

  const query = { companyId }
  if (month) query.month = month
  if (year) query.year = Number(year)

  if (employeeId && employeeId !== 'all') {
    const resolved = await resolveEmployeeKey(companyId, employeeId)
    query.employeeId = resolved || '__none__'
  }

  if (departmentId && departmentId !== 'all') {
    const employees = await User.find({ companyId, role: 'employee', departmentId }).select('employeeId')
    const ids = employees.map((emp) => String(emp.employeeId || emp._id))
    if (query.employeeId && typeof query.employeeId === 'string') {
      query.employeeId = ids.includes(query.employeeId) ? query.employeeId : '__none__'
    } else {
      query.employeeId = { $in: ids }
    }
  }

  const items = await Payroll.find(query).sort({ year: -1, month: -1, createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll records fetched successfully',
    data: items.map((item) => serializePayroll(item, employeeMap)),
    items: items.map((item) => serializePayroll(item, employeeMap))
  })
})

export const getPayrollById = asyncHandler(async (req, res) => {
  const item = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll record fetched successfully',
    data: serializePayroll(item, employeeMap),
    item: serializePayroll(item, employeeMap)
  })
})

export const getPayrollByEmployee = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const employeeId = await resolveEmployeeKey(companyId, req.params.employeeId)
  if (!employeeId) return res.status(404).json({ success: false, message: 'Employee not found for this company' })

  const items = await Payroll.find({ companyId, employeeId }).sort({ year: -1, month: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  return res.status(200).json({
    success: true,
    message: 'Employee payroll fetched successfully',
    data: items.map((item) => serializePayroll(item, employeeMap)),
    items: items.map((item) => serializePayroll(item, employeeMap))
  })
})

export const updatePayroll = asyncHandler(async (req, res) => {
  const item = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  const { basicSalary, hra, allowances, bonus, deductions, tax, status } = req.body

  if (basicSalary !== undefined) item.basicSalary = num(basicSalary)
  if (hra !== undefined) item.hra = num(hra)
  if (allowances !== undefined) item.allowances = num(allowances)
  if (bonus !== undefined) item.bonus = num(bonus)
  if (deductions !== undefined) item.deductions = num(deductions)
  if (tax !== undefined) item.tax = num(tax)

  if (status !== undefined) {
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payroll status' })
    }
    item.status = normalizedStatus
  }

  item.netSalary = computeNet(item)
  await item.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'payroll',
    action: 'payroll_updated',
    message: `Payroll ${item._id} updated`,
    metadata: { payrollId: item._id, employeeId: item.employeeId, month: item.month, year: item.year }
  })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll updated successfully',
    data: serializePayroll(item, employeeMap),
    item: serializePayroll(item, employeeMap)
  })
})

export const getPayslip = asyncHandler(async (req, res) => {
  const item = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  const employeeMap = await getEmployeeMap(req.user.companyId)
  const row = serializePayroll(item, employeeMap)

  const lines = [
    `Employee: ${row.employeeName}`,
    `Employee ID: ${row.employeeId}`,
    `Month/Year: ${row.month}/${row.year}`,
    `Basic Salary: ${row.basicSalary}`,
    `HRA: ${row.hra}`,
    `Allowances: ${row.allowances}`,
    `Bonus: ${row.bonus}`,
    `Deductions: ${row.deductions}`,
    `Tax: ${row.tax}`,
    `Working Days: ${row.workingDays || 0}`,
    `Attendance Days: ${row.attendanceDays || 0}`,
    `Attendance Deduction: ${row.attendanceDeduction || 0}`,
    `Net Salary: ${row.netSalary}`,
    `Status: ${row.status}`
  ]

  const pdfBuffer = generatePdfBuffer('Payslip', lines)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=payslip-${row.employeeId}-${row.month}-${row.year}.pdf`)
  return res.status(200).send(pdfBuffer)
})

// Backward compatibility aliases
export const createPayroll = generatePayroll
export const deletePayroll = asyncHandler(async (req, res) => {
  const existing = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!existing) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  const result = await Payroll.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'payroll',
    action: 'payroll_deleted',
    message: `Payroll ${req.params.id} deleted`,
    metadata: { payrollId: req.params.id, employeeId: existing.employeeId, month: existing.month, year: existing.year }
  })

  return res.status(200).json({ success: true, message: 'Payroll deleted successfully' })
})
