import asyncHandler from '../utils/asyncHandler.js'
import Payroll from '../models/Payroll.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['generated', 'paid', 'pending'])

const num = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const computeNet = ({ basicSalary, hra, allowances, bonus, deductions, tax }) =>
  num(basicSalary) + num(hra) + num(allowances) + num(bonus) - num(deductions) - num(tax)

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
    status = 'generated'
  } = req.body

  if (!month || !year) {
    return res.status(400).json({ success: false, message: 'month and year are required' })
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

  const generated = []
  for (const empId of targetEmployeeIds) {
    const basicSalary = num(employeeMap[empId]?.salary)

    const existing = await Payroll.findOne({ companyId, employeeId: empId, month, year: Number(year) })
    if (existing) {
      existing.basicSalary = basicSalary
      existing.hra = num(hra)
      existing.allowances = num(allowances)
      existing.bonus = num(bonus)
      existing.deductions = num(deductions)
      existing.tax = num(tax)
      existing.netSalary = computeNet(existing)
      existing.status = normalizedStatus
      existing.generatedBy = req.user.id
      await existing.save()
      generated.push(existing)
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
        deductions: num(deductions),
        tax: num(tax),
        netSalary: computeNet({ basicSalary, hra, allowances, bonus, deductions, tax }),
        status: normalizedStatus,
        generatedBy: req.user.id
      })
      generated.push(item)
    }
  }

  await ActivityLog.create({
    companyId,
    userId: req.user.id,
    module: 'payroll',
    action: 'payroll_generated',
    message: `Payroll generated for ${generated.length} employee(s) (${month}-${year})`,
    metadata: { month, year, totalEmployees: generated.length }
  })

  return res.status(201).json({
    success: true,
    message: 'Payroll generated successfully',
    data: generated.map((item) => serializePayroll(item, employeeMap))
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
    query.employeeId = { $in: ids }
  }

  const items = await Payroll.find(query).sort({ year: -1, month: -1, createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll records fetched successfully',
    data: items.map((item) => serializePayroll(item, employeeMap))
  })
})

export const getPayrollById = asyncHandler(async (req, res) => {
  const item = await Payroll.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Payroll record not found' })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll record fetched successfully',
    data: serializePayroll(item, employeeMap)
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
    data: items.map((item) => serializePayroll(item, employeeMap))
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

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Payroll updated successfully',
    data: serializePayroll(item, employeeMap)
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
  const result = await Payroll.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Payroll record not found' })
  return res.status(200).json({ success: true, message: 'Payroll deleted successfully' })
})
