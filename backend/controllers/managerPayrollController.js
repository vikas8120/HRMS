import asyncHandler from '../utils/asyncHandler.js'
import Payroll from '../models/Payroll.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import ManagerBonusRecommendation from '../models/ManagerBonusRecommendation.js'

const num = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email departmentId designation')

  const teamKeySet = new Set()
  const employeeMap = {}
  for (const row of team) {
    const id = String(row._id)
    const employeeId = String(row.employeeId || row._id)
    const entry = {
      id,
      employeeId,
      name: row.name || '-',
      email: row.email || '-',
      departmentId: row.departmentId || null,
      designation: row.designation || '-'
    }
    teamKeySet.add(id)
    teamKeySet.add(employeeId)
    employeeMap[id] = entry
    employeeMap[employeeId] = entry
  }

  return { companyId, managerId, teamKeySet, employeeMap }
}

const serializePayrollView = (item, employeeMap = {}) => {
  const key = String(item.employeeId || '')
  const employee = employeeMap[key] || {}
  const grossSalary = num(item.basicSalary) + num(item.hra) + num(item.allowances) + num(item.bonus)
  return {
    id: item._id,
    employeeId: employee.employeeId || item.employeeId || null,
    employeeName: employee.name || '-',
    email: employee.email || '-',
    departmentId: employee.departmentId || null,
    designation: employee.designation || '-',
    month: item.month || '',
    year: Number(item.year || 0),
    grossSalary,
    netSalary: num(item.netSalary),
    bonus: num(item.bonus),
    deductions: num(item.deductions),
    tax: num(item.tax),
    status: String(item.status || 'generated').toLowerCase(),
    createdAt: item.createdAt || null
  }
}

export const getManagerPayrollTeamSummary = asyncHandler(async (req, res) => {
  const { companyId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const month = String(req.query.month || '').trim()
  const year = String(req.query.year || '').trim()
  const employeeId = String(req.query.employeeId || 'all').trim()
  const status = String(req.query.status || 'all').trim().toLowerCase()

  const query = { companyId }
  if (month) query.month = month
  if (year) query.year = Number(year)
  if (employeeId !== 'all') query.employeeId = employeeId
  if (status !== 'all') query.status = status

  const rows = await Payroll.find(query).sort({ year: -1, month: -1, createdAt: -1 })
  const scoped = rows
    .filter((x) => teamKeySet.has(String(x.employeeId || '')))
    .map((x) => serializePayrollView(x, employeeMap))

  const summary = {
    totalEmployees: new Set(scoped.map((x) => String(x.employeeId))).size,
    totalNetSalary: scoped.reduce((sum, x) => sum + num(x.netSalary), 0),
    totalGrossSalary: scoped.reduce((sum, x) => sum + num(x.grossSalary), 0),
    totalBonus: scoped.reduce((sum, x) => sum + num(x.bonus), 0)
  }

  return res.status(200).json({ success: true, data: scoped, summary })
})

export const getManagerPayrollStatus = asyncHandler(async (req, res) => {
  const { companyId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const month = String(req.query.month || '').trim()
  const year = String(req.query.year || '').trim()

  const query = { companyId }
  if (month) query.month = month
  if (year) query.year = Number(year)

  const rows = await Payroll.find(query).sort({ year: -1, month: -1, createdAt: -1 })
  const scoped = rows
    .filter((x) => teamKeySet.has(String(x.employeeId || '')))
    .map((x) => serializePayrollView(x, employeeMap))

  const statusCounts = scoped.reduce((acc, row) => {
    const key = row.status || 'generated'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return res.status(200).json({
    success: true,
    data: scoped,
    statusSummary: {
      generated: statusCounts.generated || 0,
      pending: statusCounts.pending || 0,
      paid: statusCounts.paid || 0
    }
  })
})

export const createManagerBonusRecommendation = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const {
    employeeId,
    recommendationType = 'bonus',
    amount = 0,
    reason = '',
    remarks = ''
  } = req.body || {}

  const employeeKey = String(employeeId || '').trim()
  if (!employeeKey || !teamKeySet.has(employeeKey)) {
    return res.status(403).json({ success: false, message: 'Recommendation allowed only for assigned employees' })
  }
  if (!num(amount) || num(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' })
  }
  if (!String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'reason is required' })
  }

  const row = await ManagerBonusRecommendation.create({
    companyId,
    managerId,
    employeeId: employeeKey,
    recommendationType: String(recommendationType || 'bonus').trim().toLowerCase(),
    amount: num(amount),
    reason: String(reason).trim(),
    remarks: String(remarks || '').trim(),
    status: 'submitted'
  })

  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_payroll',
    action: 'bonus_recommendation_submitted',
    message: `Bonus recommendation submitted for ${employeeMap[employeeKey]?.name || employeeKey}`,
    metadata: { recommendationId: row._id, employeeId: employeeKey, amount: num(amount) }
  })

  const hrAdmins = await User.find({ companyId, role: { $in: ['admin', 'hr'] } }).select('_id')
  for (const user of hrAdmins) {
    await ActivityLog.create({
      companyId,
      userId: String(user._id),
      module: 'manager_payroll',
      action: 'bonus_recommendation_received',
      message: `Manager submitted bonus recommendation for ${employeeMap[employeeKey]?.name || employeeKey}`,
      metadata: { recommendationId: row._id, managerId, employeeId: employeeKey, amount: num(amount) }
    })
  }

  return res.status(201).json({
    success: true,
    message: 'Bonus recommendation submitted to HR/Admin',
    data: {
      id: row._id,
      employeeId: row.employeeId,
      employeeName: employeeMap[employeeKey]?.name || '-',
      recommendationType: row.recommendationType,
      amount: row.amount,
      reason: row.reason,
      remarks: row.remarks,
      status: row.status,
      createdAt: row.createdAt || null
    }
  })
})
