import asyncHandler from '../utils/asyncHandler.js'
import Leave from '../models/Leave.js'
import User from '../models/User.js'
import CompanySettings from '../models/CompanySettings.js'

const ALLOWED_TYPES = new Set(['casual', 'sick', 'earned'])

const dateOnly = (value) => String(value || '').slice(0, 10)

const toLeave = (item) => ({
  id: item._id,
  leaveType: item.leaveType || 'casual',
  startDate: item.startDate || null,
  endDate: item.endDate || null,
  totalDays: Number(item.totalDays || 0),
  reason: item.reason || '',
  status: String(item.status || 'pending').toLowerCase(),
  approvedBy: item.approvedBy || null,
  rejectionReason: item.rejectionReason || '',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const daysBetweenInclusive = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)

  const employee = await User.findOne({
    _id: userId,
    companyId,
    role: 'employee',
    status: 'active'
  }).select('_id employeeId companyId role status')

  if (!employee) return null

  return {
    companyId,
    userId,
    employeeId: String(employee.employeeId || employee._id)
  }
}

const getLookupKeys = (scope) => [...new Set([String(scope.employeeId), String(scope.userId)])]

const isOverlapping = (aStart, aEnd, bStart, bEnd) => {
  const startA = new Date(aStart).getTime()
  const endA = new Date(aEnd).getTime()
  const startB = new Date(bStart).getTime()
  const endB = new Date(bEnd).getTime()
  if (![startA, endA, startB, endB].every(Number.isFinite)) return false
  return startA <= endB && startB <= endA
}

const loadPolicy = async (companyId) => {
  let settings = await CompanySettings.findOne({ companyId })
  if (!settings) settings = await CompanySettings.create({ companyId })
  const policy = settings.leavePolicy || { casual: 12, sick: 12, earned: 15 }
  return {
    casual: Number(policy.casual || 0),
    sick: Number(policy.sick || 0),
    earned: Number(policy.earned || 0)
  }
}

const loadBalance = async (scope) => {
  const policy = await loadPolicy(scope.companyId)
  const approved = await Leave.find({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    status: 'approved'
  })

  const used = { casual: 0, sick: 0, earned: 0 }
  for (const row of approved) {
    const key = String(row.leaveType || '').toLowerCase()
    if (Object.prototype.hasOwnProperty.call(used, key)) used[key] += Number(row.totalDays || 0)
  }

  return {
    policy,
    used,
    balance: {
      casual: Math.max(policy.casual - used.casual, 0),
      sick: Math.max(policy.sick - used.sick, 0),
      earned: Math.max(policy.earned - used.earned, 0)
    }
  }
}

export const getEmployeeLeaves = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: [] })

  const status = String(req.query.status || 'all').toLowerCase()
  const type = String(req.query.leaveType || 'all').toLowerCase()

  const query = {
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  }

  if (status !== 'all') query.status = status
  if (type !== 'all' && ALLOWED_TYPES.has(type)) query.leaveType = type

  const rows = await Leave.find(query).sort({ createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Leave requests fetched successfully',
    data: rows.map((row) => toLeave(row))
  })
})

export const getEmployeeLeaveById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Leave.findOne({
    _id: req.params.id,
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  })

  if (!row) return res.status(404).json({ success: false, message: 'Leave request not found', data: null })

  return res.status(200).json({
    success: true,
    message: 'Leave request details fetched successfully',
    data: toLeave(row)
  })
})

export const applyEmployeeLeave = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const leaveType = String(req.body?.leaveType || '').toLowerCase().trim()
  const startDate = dateOnly(req.body?.startDate)
  const endDate = dateOnly(req.body?.endDate)
  const reason = String(req.body?.reason || '').trim()

  if (!ALLOWED_TYPES.has(leaveType)) {
    return res.status(400).json({ success: false, message: 'Invalid leaveType', data: null })
  }
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate and reason are required', data: null })
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'endDate cannot be before startDate', data: null })
  }

  const totalDays = daysBetweenInclusive(startDate, endDate)
  if (!totalDays || totalDays <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range', data: null })
  }

  const existing = await Leave.find({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    status: { $in: ['pending', 'approved'] }
  }).sort({ createdAt: -1 })

  const overlap = existing.find((row) => isOverlapping(startDate, endDate, row.startDate, row.endDate))
  if (overlap) {
    return res.status(400).json({
      success: false,
      message: 'Overlapping leave request exists for selected date range',
      data: toLeave(overlap)
    })
  }

  const row = await Leave.create({
    companyId: scope.companyId,
    employeeId: scope.employeeId,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    status: 'pending',
    approvedBy: null,
    rejectionReason: ''
  })

  return res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully',
    data: toLeave(row)
  })
})

export const updateEmployeeLeave = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Leave.findOne({
    _id: req.params.id,
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  })

  if (!row) return res.status(404).json({ success: false, message: 'Leave request not found', data: null })
  if (String(row.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave request can be edited', data: toLeave(row) })
  }

  const leaveType = String(req.body?.leaveType || row.leaveType || '').toLowerCase().trim()
  const startDate = dateOnly(req.body?.startDate || row.startDate)
  const endDate = dateOnly(req.body?.endDate || row.endDate)
  const reason = String(req.body?.reason || row.reason || '').trim()

  if (!ALLOWED_TYPES.has(leaveType)) {
    return res.status(400).json({ success: false, message: 'Invalid leaveType', data: null })
  }
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate and reason are required', data: null })
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ success: false, message: 'endDate cannot be before startDate', data: null })
  }

  const totalDays = daysBetweenInclusive(startDate, endDate)
  if (!totalDays || totalDays <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range', data: null })
  }

  const existing = await Leave.find({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    _id: { $ne: row._id },
    status: { $in: ['pending', 'approved'] }
  })

  const overlap = existing.find((item) => isOverlapping(startDate, endDate, item.startDate, item.endDate))
  if (overlap) {
    return res.status(400).json({
      success: false,
      message: 'Overlapping leave request exists for selected date range',
      data: toLeave(overlap)
    })
  }

  row.leaveType = leaveType
  row.startDate = startDate
  row.endDate = endDate
  row.totalDays = totalDays
  row.reason = reason
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Leave request updated successfully',
    data: toLeave(row)
  })
})

export const cancelEmployeeLeave = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Leave.findOne({
    _id: req.params.id,
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  })

  if (!row) return res.status(404).json({ success: false, message: 'Leave request not found', data: null })
  if (String(row.status || '').toLowerCase() !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending leave request can be cancelled', data: toLeave(row) })
  }

  await Leave.deleteOne({ _id: row._id })

  return res.status(200).json({
    success: true,
    message: 'Leave request cancelled successfully',
    data: toLeave(row)
  })
})

export const getEmployeeLeaveBalance = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const balance = await loadBalance(scope)

  return res.status(200).json({
    success: true,
    message: 'Leave balance fetched successfully',
    data: balance
  })
})

export const getEmployeeLeavePolicy = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const policy = await loadPolicy(scope.companyId)

  return res.status(200).json({
    success: true,
    message: 'Leave policy fetched successfully',
    data: policy
  })
})
