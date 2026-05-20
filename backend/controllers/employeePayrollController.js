import asyncHandler from '../utils/asyncHandler.js'
import Payroll from '../models/Payroll.js'
import User from '../models/User.js'

const num = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const generatePdfBuffer = (title, lines = []) => {
  const safe = (value) => String(value).replace(/[()\\]/g, ' ')
  const contentLines = [title, ...lines].map((line, index) => `BT /F1 11 Tf 50 ${780 - (index * 16)} Td (${safe(line)}) Tj ET`).join('\n')
  const stream = `${contentLines}\n`
  const len = Buffer.byteLength(stream, 'utf8')

  const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length ${len} >> stream\n${stream}endstream endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000120 00000 n \n0000000247 00000 n \n0000000317 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${317 + len + 32}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)

  const employee = await User.findOne({
    _id: userId,
    companyId,
    role: 'employee',
    status: 'active'
  }).select('_id employeeId name email departmentId designation')

  if (!employee) return null

  return {
    companyId,
    userId,
    employeeId: String(employee.employeeId || employee._id),
    name: employee.name || '-',
    email: employee.email || '-',
    departmentId: employee.departmentId || null,
    designation: employee.designation || '-'
  }
}

const getLookupKeys = (scope) => [...new Set([String(scope.employeeId), String(scope.userId)])]

const buildAttendanceSummary = (row) => {
  const hasAttendanceData = row.workingDays !== undefined || row.attendanceDays !== undefined || row.attendanceDeduction !== undefined
  if (!hasAttendanceData) return null

  return {
    workingDays: Number(row.workingDays || 0),
    attendanceDays: Number(row.attendanceDays || 0),
    attendanceDeduction: num(row.attendanceDeduction)
  }
}

const toPayroll = (row, scope) => ({
  id: row._id,
  employeeId: scope.employeeId,
  employeeName: scope.name,
  employeeEmail: scope.email,
  departmentId: scope.departmentId,
  designation: scope.designation,
  month: String(row.month || ''),
  year: Number(row.year || 0),
  salaryBreakdown: {
    basicSalary: num(row.basicSalary),
    allowances: num(row.allowances) + num(row.hra) + num(row.bonus),
    deductions: num(row.deductions) + num(row.tax),
    netSalary: num(row.netSalary)
  },
  paymentStatus: String(row.status || 'generated').toLowerCase(),
  attendanceSummary: buildAttendanceSummary(row),
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null
})

const findScopedPayrollById = async (scope, id) => Payroll.findOne({
  _id: id,
  companyId: scope.companyId,
  employeeId: { $in: getLookupKeys(scope) }
})

export const getEmployeePayrollHistory = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: [] })

  const rows = await Payroll.find({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  }).sort({ year: -1, month: -1, createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Payroll history fetched successfully',
    data: rows.map((row) => toPayroll(row, scope))
  })
})

export const getEmployeeLatestPayslip = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Payroll.findOne({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  }).sort({ year: -1, month: -1, createdAt: -1 })

  if (!row) {
    return res.status(200).json({ success: true, message: 'No payroll record found', data: null })
  }

  return res.status(200).json({
    success: true,
    message: 'Latest payslip fetched successfully',
    data: toPayroll(row, scope)
  })
})

export const getEmployeePayrollById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedPayrollById(scope, req.params.id)
  if (!row) {
    return res.status(404).json({ success: false, message: 'Payroll record not found', data: null })
  }

  return res.status(200).json({
    success: true,
    message: 'Payslip details fetched successfully',
    data: toPayroll(row, scope)
  })
})

export const downloadEmployeePayslipPdf = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedPayrollById(scope, req.params.id)
  if (!row) {
    return res.status(404).json({ success: false, message: 'Payroll record not found', data: null })
  }

  const payload = toPayroll(row, scope)

  const lines = [
    `Employee: ${payload.employeeName}`,
    `Employee ID: ${payload.employeeId}`,
    `Month/Year: ${payload.month}/${payload.year}`,
    `Basic Salary: ${payload.salaryBreakdown.basicSalary}`,
    `Allowances: ${payload.salaryBreakdown.allowances}`,
    `Deductions: ${payload.salaryBreakdown.deductions}`,
    `Net Salary: ${payload.salaryBreakdown.netSalary}`,
    `Payment Status: ${payload.paymentStatus}`
  ]

  if (payload.attendanceSummary) {
    lines.push(`Working Days: ${payload.attendanceSummary.workingDays}`)
    lines.push(`Attendance Days: ${payload.attendanceSummary.attendanceDays}`)
    lines.push(`Attendance Deduction: ${payload.attendanceSummary.attendanceDeduction}`)
  }

  const pdfBuffer = generatePdfBuffer('Employee Payslip', lines)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=payslip-${payload.employeeId}-${payload.month}-${payload.year}.pdf`)
  return res.status(200).send(pdfBuffer)
})
