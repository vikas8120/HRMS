import asyncHandler from '../utils/asyncHandler.js'
import Leave from '../models/Leave.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['pending', 'approved', 'rejected'])
const ALLOWED_LEAVE_TYPES = new Set(['casual', 'sick', 'earned'])

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
  designation: employeeMap[String(item.employeeId || '')]?.designation || '-',
  leaveType: item.leaveType || 'casual',
  startDate: item.startDate || null,
  endDate: item.endDate || null,
  totalDays: Number(item.totalDays || 0),
  reason: item.reason || '',
  status: item.status || 'pending',
  approvedBy: item.approvedBy || null,
  rejectionReason: item.rejectionReason || '',
  appliedDate: item.createdAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)

  const team = await User.find({
    companyId,
    role: 'employee',
    managerId
  }).select('_id employeeId name departmentId designation')

  const lookupKeys = [...new Set(
    team.flatMap((employee) => [String(employee._id), String(employee.employeeId || '')].filter(Boolean))
  )]

  const employeeMap = {}
  for (const employee of team) {
    const value = {
      name: employee.name || '-',
      departmentId: employee.departmentId || null,
      designation: employee.designation || '-'
    }
    employeeMap[String(employee._id)] = value
    if (employee.employeeId) employeeMap[String(employee.employeeId)] = value
  }

  return { companyId, managerId, team, lookupKeys, employeeMap }
}

const getManagerApplicantKey = async (req) => {
  const manager = await User.findOne({
    _id: req.user.id,
    companyId: req.user.companyId,
    role: 'manager'
  }).select('_id employeeId name departmentId designation')

  if (!manager) return null
  return {
    managerDocId: String(manager._id),
    managerEmployeeId: String(manager.employeeId || manager._id),
    managerName: manager.name || 'Manager',
    departmentId: manager.departmentId || null,
    designation: manager.designation || 'Manager'
  }
}

const findScopedLeave = async (req, leaveId) => {
  const { companyId, lookupKeys } = await buildTeamScope(req)
  if (!lookupKeys.length) return null
  return Leave.findOne({
    _id: leaveId,
    companyId,
    employeeId: { $in: lookupKeys }
  })
}

export const getManagerLeaves = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap } = await buildTeamScope(req)
  const status = String(req.query.status || 'all').toLowerCase()
  const employeeId = String(req.query.employeeId || 'all').trim()
  const leaveType = String(req.query.leaveType || 'all').toLowerCase()
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()

  if (!lookupKeys.length) {
    return res.status(200).json({ success: true, data: [] })
  }

  const query = { companyId, employeeId: { $in: lookupKeys } }
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status
  if (employeeId !== 'all') query.employeeId = employeeId
  if (leaveType !== 'all') query.leaveType = leaveType
  if (from) query.startDate = { ...(query.startDate || {}), $gte: from }
  if (to) query.endDate = { ...(query.endDate || {}), $lte: to }

  const rows = await Leave.find(query).sort({ createdAt: -1 })
  return res.status(200).json({
    success: true,
    data: rows.map((item) => serializeLeave(item, employeeMap))
  })
})

export const getManagerPendingLeaves = asyncHandler(async (req, res) => {
  req.query.status = 'pending'
  return getManagerLeaves(req, res)
})

export const getManagerLeaveById = asyncHandler(async (req, res) => {
  const { employeeMap } = await buildTeamScope(req)
  const item = await findScopedLeave(req, req.params.leaveId)
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found in your team scope' })

  return res.status(200).json({
    success: true,
    data: serializeLeave(item, employeeMap)
  })
})

export const approveManagerLeave = asyncHandler(async (req, res) => {
  const { employeeMap, companyId, managerId } = await buildTeamScope(req)
  const item = await findScopedLeave(req, req.params.leaveId)
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found in your team scope' })
  if (String(item.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: `Only pending requests can be approved. Current status: ${item.status}` })
  }

  item.status = 'approved'
  item.approvedBy = managerId
  item.rejectionReason = ''
  await item.save()

  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_leave',
    action: 'leave_approved',
    message: `Manager approved leave ${item._id}`,
    metadata: { leaveId: item._id, employeeId: item.employeeId }
  })

  return res.status(200).json({
    success: true,
    message: 'Leave approved successfully',
    data: serializeLeave(item, employeeMap)
  })
})

export const rejectManagerLeave = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body || {}
  if (!rejectionReason || !String(rejectionReason).trim()) {
    return res.status(400).json({ success: false, message: 'rejectionReason is required' })
  }

  const { employeeMap, companyId, managerId } = await buildTeamScope(req)
  const item = await findScopedLeave(req, req.params.leaveId)
  if (!item) return res.status(404).json({ success: false, message: 'Leave request not found in your team scope' })
  if (String(item.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: `Only pending requests can be rejected. Current status: ${item.status}` })
  }

  item.status = 'rejected'
  item.approvedBy = managerId
  item.rejectionReason = String(rejectionReason).trim()
  await item.save()

  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_leave',
    action: 'leave_rejected',
    message: `Manager rejected leave ${item._id}`,
    metadata: { leaveId: item._id, employeeId: item.employeeId, rejectionReason: item.rejectionReason }
  })

  return res.status(200).json({
    success: true,
    message: 'Leave rejected successfully',
    data: serializeLeave(item, employeeMap)
  })
})

export const applyManagerLeave = asyncHandler(async (req, res) => {
  const managerMeta = await getManagerApplicantKey(req)
  if (!managerMeta) return res.status(404).json({ success: false, message: 'Manager profile not found' })

  const { leaveType = 'casual', startDate, endDate, totalDays, reason = '' } = req.body || {}
  const normalizedType = String(leaveType || '').toLowerCase()
  if (!ALLOWED_LEAVE_TYPES.has(normalizedType)) {
    return res.status(400).json({ success: false, message: 'Invalid leaveType value' })
  }
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' })
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'endDate cannot be before startDate' })
  }

  const computedDays = Number(totalDays || 0) > 0 ? Number(totalDays) : daysBetweenInclusive(startDate, endDate)
  if (!Number.isFinite(computedDays) || computedDays <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid leave duration' })
  }

  const item = await Leave.create({
    companyId: req.user.companyId,
    employeeId: managerMeta.managerEmployeeId,
    leaveType: normalizedType,
    startDate,
    endDate,
    totalDays: computedDays,
    reason: String(reason || '').trim(),
    status: 'pending',
    approvedBy: null,
    rejectionReason: ''
  })

  return res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully',
    data: {
      ...serializeLeave(item, {}),
      employeeName: managerMeta.managerName,
      designation: managerMeta.designation
    }
  })
})

export const getMyManagerLeaves = asyncHandler(async (req, res) => {
  const managerMeta = await getManagerApplicantKey(req)
  if (!managerMeta) return res.status(404).json({ success: false, message: 'Manager profile not found' })

  const status = String(req.query.status || 'all').toLowerCase()
  const leaveType = String(req.query.leaveType || 'all').toLowerCase()
  const from = String(req.query.from || '').trim()
  const to = String(req.query.to || '').trim()

  const query = {
    companyId: req.user.companyId,
    employeeId: managerMeta.managerEmployeeId
  }
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status
  if (leaveType !== 'all' && ALLOWED_LEAVE_TYPES.has(leaveType)) query.leaveType = leaveType
  if (from) query.startDate = { ...(query.startDate || {}), $gte: from }
  if (to) query.endDate = { ...(query.endDate || {}), $lte: to }

  const rows = await Leave.find(query).sort({ createdAt: -1 })
  const data = rows.map((item) => ({
    ...serializeLeave(item, {}),
    employeeName: managerMeta.managerName,
    designation: managerMeta.designation
  }))

  return res.status(200).json({ success: true, data })
})
