import asyncHandler from '../utils/asyncHandler.js'
import Leave from '../models/Leave.js'
import User from '../models/User.js'
import CompanySettings from '../models/CompanySettings.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['pending', 'approved', 'rejected'])

const daysBetweenInclusive = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
}

const serializeLeave = (item, employeeMap = {}) => ({
  id: item._id,
  employeeId: item.employeeId,
  employeeName: employeeMap[String(item.employeeId || '')]?.name || '-',
  departmentId: employeeMap[String(item.employeeId || '')]?.departmentId || null,
  companyId: item.companyId,
  leaveType: item.leaveType || 'casual',
  startDate: item.startDate || null,
  endDate: item.endDate || null,
  totalDays: Number(item.totalDays || 0),
  reason: item.reason || '',
  status: item.status || 'pending',
  approvedBy: item.approvedBy || null,
  rejectionReason: item.rejectionReason || '',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const getEmployeeMap = async (companyId) => {
  const employees = await User.find({ companyId, role: 'employee' }).select('employeeId name departmentId')
  return Object.fromEntries(employees.map((emp) => [String(emp.employeeId || emp._id), { name: emp.name || '-', departmentId: emp.departmentId || null }]))
}

const resolveEmployeeKey = async (companyId, providedEmployeeId) => {
  const raw = String(providedEmployeeId || '').trim()
  if (!raw) return null

  const employee = await User.findOne({ companyId, role: 'employee', $or: [{ employeeId: raw }, { _id: raw }] })
  if (!employee) return null

  return String(employee.employeeId || employee._id)
}

export const listLeaves = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const status = String(req.query.status || '').toLowerCase()
  const employeeFilter = String(req.query.employeeId || '').trim()
  const departmentId = String(req.query.departmentId || '').trim()
  const date = String(req.query.date || '').trim()

  const query = { companyId }
  if (status && ALLOWED_STATUS.has(status)) query.status = status
  if (employeeFilter && employeeFilter !== 'all') {
    const resolved = await resolveEmployeeKey(companyId, employeeFilter)
    if (!resolved) {
      return res.status(200).json({ success: true, message: 'Leave requests fetched successfully', data: [] })
    }
    query.employeeId = resolved
  }

  if (date) {
    query.startDate = { $lte: date }
    query.endDate = { $gte: date }
  }

  if (departmentId && departmentId !== 'all') {
    const deptEmployees = await User.find({ companyId, role: 'employee', departmentId }).select('employeeId')
    const deptEmployeeIds = deptEmployees.map((emp) => String(emp.employeeId || emp._id))
    if (query.employeeId && typeof query.employeeId === 'string') {
      query.employeeId = deptEmployeeIds.includes(query.employeeId) ? query.employeeId : '__none__'
    } else {
      query.employeeId = { $in: deptEmployeeIds }
    }
  }

  const items = await Leave.find(query).sort({ createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  return res.status(200).json({
    success: true,
    message: 'Leave requests fetched successfully',
    data: items.map((item) => serializeLeave(item, employeeMap)),
    items: items.map((item) => serializeLeave(item, employeeMap))
  })
})

export const getLeaveById = asyncHandler(async (req, res) => {
  const item = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found' })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Leave request fetched successfully',
    data: serializeLeave(item, employeeMap),
    item: serializeLeave(item, employeeMap)
  })
})

export const createLeave = asyncHandler(async (req, res) => {
  const {
    employeeId,
    leaveType = 'casual',
    startDate,
    endDate,
    totalDays,
    reason = ''
  } = req.body

  if (!employeeId || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'employeeId, startDate and endDate are required' })
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'endDate cannot be before startDate' })
  }

  const resolvedEmployeeId = await resolveEmployeeKey(req.user.companyId, employeeId)
  if (!resolvedEmployeeId) {
    return res.status(404).json({ success: false, message: 'Employee not found for this company' })
  }

  const computedDays = Number(totalDays || 0) > 0 ? Number(totalDays) : daysBetweenInclusive(startDate, endDate)
  if (!Number.isFinite(computedDays) || computedDays <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid leave duration' })
  }

  const item = await Leave.create({
    companyId: req.user.companyId,
    employeeId: resolvedEmployeeId,
    leaveType,
    startDate,
    endDate,
    totalDays: computedDays,
    reason,
    status: 'pending',
    approvedBy: null,
    rejectionReason: ''
  })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(201).json({
    success: true,
    message: 'Leave request created successfully',
    data: serializeLeave(item, employeeMap),
    item: serializeLeave(item, employeeMap)
  })
})

export const approveLeave = asyncHandler(async (req, res) => {
  const item = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found' })
  if (String(item.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: `Only pending leave requests can be approved. Current status: ${item.status}` })
  }
  if (new Date(item.endDate) < new Date(item.startDate)) {
    return res.status(400).json({ success: false, message: 'Invalid leave date range' })
  }

  let settings = await CompanySettings.findOne({ companyId: req.user.companyId })
  if (!settings) settings = await CompanySettings.create({ companyId: req.user.companyId })
  const policy = settings.leavePolicy || { casual: 12, sick: 12, earned: 15 }
  const leaveKey = String(item.leaveType || '').toLowerCase()
  const maxAllowed = Number(policy[leaveKey] || 0)
  const approvedLeaves = await Leave.find({
    companyId: req.user.companyId,
    employeeId: item.employeeId,
    status: 'approved',
    leaveType: leaveKey,
    _id: { $ne: item._id }
  })
  const used = approvedLeaves.reduce((sum, row) => sum + Number(row.totalDays || 0), 0)
  if (used + Number(item.totalDays || 0) > maxAllowed) {
    return res.status(400).json({
      success: false,
      message: `Cannot approve leave. ${leaveKey} balance exceeded`,
      details: { policy: maxAllowed, used, requested: Number(item.totalDays || 0), available: Math.max(maxAllowed - used, 0) }
    })
  }

  item.status = 'approved'
  item.approvedBy = req.user.id
  item.rejectionReason = ''
  await item.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'leave',
    action: 'leave_approved',
    message: `Leave ${item._id} approved`,
    metadata: { leaveId: item._id, employeeId: item.employeeId }
  })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Leave approved successfully',
    data: serializeLeave(item, employeeMap),
    item: serializeLeave(item, employeeMap)
  })
})

export const rejectLeave = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body
  if (!rejectionReason || !String(rejectionReason).trim()) {
    return res.status(400).json({ success: false, message: 'rejectionReason is required' })
  }

  const item = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found' })
  if (String(item.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: `Only pending leave requests can be rejected. Current status: ${item.status}` })
  }

  item.status = 'rejected'
  item.approvedBy = req.user.id
  item.rejectionReason = String(rejectionReason).trim()
  await item.save()

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Leave rejected successfully',
    data: serializeLeave(item, employeeMap),
    item: serializeLeave(item, employeeMap)
  })
})

export const getLeaveBalance = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const employeeId = await resolveEmployeeKey(companyId, req.params.employeeId)
  if (!employeeId) return res.status(404).json({ success: false, message: 'Employee not found for this company' })

  let settings = await CompanySettings.findOne({ companyId })
  if (!settings) settings = await CompanySettings.create({ companyId })

  const policy = settings.leavePolicy || { casual: 12, sick: 12, earned: 15 }

  const approvedLeaves = await Leave.find({ companyId, employeeId, status: 'approved' })

  const used = { casual: 0, sick: 0, earned: 0 }
  for (const leave of approvedLeaves) {
    const key = String(leave.leaveType || '').toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(used, key)) continue
    used[key] += Number(leave.totalDays || 0)
  }

  const balance = {
    casual: Math.max(Number(policy.casual || 0) - used.casual, 0),
    sick: Math.max(Number(policy.sick || 0) - used.sick, 0),
    earned: Math.max(Number(policy.earned || 0) - used.earned, 0)
  }

  return res.status(200).json({
    success: true,
    message: 'Leave balance fetched successfully',
    data: {
      employeeId,
      policy,
      used,
      balance
    }
  })
})

export const setLeavePolicy = asyncHandler(async (req, res) => {
  const { casual, sick, earned } = req.body

  const nextPolicy = {
    casual: Number(casual ?? 0),
    sick: Number(sick ?? 0),
    earned: Number(earned ?? 0)
  }

  if (Object.values(nextPolicy).some((value) => !Number.isFinite(value) || value < 0)) {
    return res.status(400).json({ success: false, message: 'casual, sick and earned must be non-negative numbers' })
  }

  let settings = await CompanySettings.findOne({ companyId: req.user.companyId })
  if (!settings) settings = await CompanySettings.create({ companyId: req.user.companyId })

  settings.leavePolicy = nextPolicy
  await settings.save()

  return res.status(200).json({
    success: true,
    message: 'Leave policy updated successfully',
    data: settings.leavePolicy
  })
})

export const getLeavePolicy = asyncHandler(async (req, res) => {
  let settings = await CompanySettings.findOne({ companyId: req.user.companyId })
  if (!settings) settings = await CompanySettings.create({ companyId: req.user.companyId })

  return res.status(200).json({
    success: true,
    message: 'Leave policy fetched successfully',
    data: settings.leavePolicy
  })
})

// Backward compatibility aliases for existing routes
export const updateLeave = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (String(status || '').toLowerCase() === 'approved') return approveLeave(req, res)
  if (String(status || '').toLowerCase() === 'rejected') return rejectLeave(req, res)

  return res.status(400).json({ success: false, message: 'Use approve/reject endpoints for status updates' })
})

export const deleteLeave = asyncHandler(async (req, res) => {
  const result = await Leave.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Leave request not found' })
  return res.status(200).json({ success: true, message: 'Leave deleted successfully' })
})
