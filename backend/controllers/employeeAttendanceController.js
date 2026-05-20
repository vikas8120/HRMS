import asyncHandler from '../utils/asyncHandler.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata'

const getDateKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(date)
}

const normalizeStatus = (value) => {
  const status = String(value || '').trim().toLowerCase()
  return status === 'half day' ? 'half-day' : status
}

const getHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const inTime = new Date(checkIn).getTime()
  const outTime = new Date(checkOut).getTime()
  if (!Number.isFinite(inTime) || !Number.isFinite(outTime) || outTime <= inTime) return 0
  return Number(((outTime - inTime) / (1000 * 60 * 60)).toFixed(2))
}

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)

  const employee = await User.findOne({
    _id: userId,
    companyId,
    role: 'employee',
    status: 'active'
  }).select('_id employeeId name role companyId')

  if (!employee) return null

  return {
    companyId,
    userId,
    employeeId: String(employee.employeeId || employee._id),
    employeeName: employee.name || 'Employee'
  }
}

const getLookupKeys = (scope) => [...new Set([String(scope.employeeId), String(scope.userId)])]

const toRecord = (row, fallbackDate) => ({
  id: row?._id || null,
  date: row?.date || fallbackDate || null,
  checkIn: row?.checkIn || null,
  checkOut: row?.checkOut || null,
  workingHours: Number(row?.workingHours || getHours(row?.checkIn, row?.checkOut)),
  status: normalizeStatus(row?.status || 'absent'),
  notes: row?.notes || '',
  regularizationRequest: row?.regularizationRequest || null,
  createdAt: row?.createdAt || null,
  updatedAt: row?.updatedAt || null
})

export const getEmployeeAttendanceToday = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const today = getDateKey()
  const row = await Attendance.findOne({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    date: today
  }).sort({ createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Today attendance fetched successfully',
    data: toRecord(row, today)
  })
})

export const employeeCheckIn = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const today = getDateKey()
  const nowIso = new Date().toISOString()

  const existing = await Attendance.findOne({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    date: today
  }).sort({ createdAt: -1 })

  if (existing?.checkIn) {
    return res.status(400).json({ success: false, message: 'Already checked in for today', data: toRecord(existing, today) })
  }

  const status = Number(new Intl.DateTimeFormat('en-GB', { timeZone: APP_TIMEZONE, hour: '2-digit', hour12: false }).format(new Date())) >= 10
    ? 'late'
    : 'present'

  const payload = {
    companyId: scope.companyId,
    employeeId: scope.employeeId,
    userId: scope.userId,
    date: today,
    checkIn: nowIso,
    checkOut: null,
    status,
    workingHours: 0,
    markedBy: scope.userId
  }

  let row
  if (!existing) {
    row = await Attendance.create(payload)
  } else {
    Object.assign(existing, payload)
    await existing.save()
    row = existing
  }

  return res.status(200).json({
    success: true,
    message: 'Check-in recorded successfully',
    data: toRecord(row, today)
  })
})

export const employeeCheckOut = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const today = getDateKey()
  const row = await Attendance.findOne({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    date: today
  }).sort({ createdAt: -1 })

  if (!row?.checkIn) {
    return res.status(400).json({ success: false, message: 'Check-in is required before check-out', data: toRecord(row, today) })
  }

  if (row?.checkOut) {
    return res.status(400).json({ success: false, message: 'Already checked out for today', data: toRecord(row, today) })
  }

  const outTime = new Date().toISOString()
  const workingHours = getHours(row.checkIn, outTime)

  row.checkOut = outTime
  row.workingHours = workingHours
  if (workingHours < 4 && normalizeStatus(row.status) === 'present') row.status = 'half-day'
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Check-out recorded successfully',
    data: toRecord(row, today)
  })
})

export const getEmployeeAttendanceMonthly = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const month = String(req.query.month || getDateKey().slice(0, 7)).slice(0, 7)

  const rows = await Attendance.find({
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    date: { $regex: `^${month}` }
  }).sort({ date: 1, createdAt: 1 })

  const normalized = rows.map((item) => toRecord(item))
  const summary = {
    month,
    totalDaysMarked: normalized.length,
    present: normalized.filter((x) => x.status === 'present').length,
    absent: normalized.filter((x) => x.status === 'absent').length,
    late: normalized.filter((x) => x.status === 'late').length,
    halfDay: normalized.filter((x) => x.status === 'half-day').length,
    workingHoursTotal: Number(normalized.reduce((sum, x) => sum + Number(x.workingHours || 0), 0).toFixed(2))
  }

  return res.status(200).json({
    success: true,
    message: 'Monthly attendance summary fetched successfully',
    data: summary
  })
})

export const getEmployeeAttendanceHistory = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const month = String(req.query.month || '').trim().slice(0, 7)
  const view = String(req.query.view || 'list').trim().toLowerCase()

  const query = {
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  }

  if (month) query.date = { $regex: `^${month}` }

  const rows = await Attendance.find(query).sort({ date: -1, createdAt: -1 }).limit(180)
  const records = rows.map((row) => toRecord(row))

  const calendar = records.reduce((acc, item) => {
    const key = String(item.date || '')
    if (key) acc[key] = {
      status: item.status,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      workingHours: item.workingHours
    }
    return acc
  }, {})

  return res.status(200).json({
    success: true,
    message: 'Attendance history fetched successfully',
    data: {
      view,
      list: records,
      calendar
    }
  })
})

export const requestAttendanceRegularization = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) {
    return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })
  }

  const date = String(req.body?.date || '').trim().slice(0, 10)
  const reason = String(req.body?.reason || '').trim()
  const requestType = String(req.body?.requestType || '').trim().toLowerCase()

  if (!date || !reason || !requestType) {
    return res.status(400).json({
      success: false,
      message: 'date, reason and requestType are required',
      data: null
    })
  }

  if (!['missed-check-in', 'missed-check-out', 'both'].includes(requestType)) {
    return res.status(400).json({
      success: false,
      message: 'requestType must be missed-check-in, missed-check-out or both',
      data: null
    })
  }

  const lookupKeys = getLookupKeys(scope)
  let row = await Attendance.findOne({
    companyId: scope.companyId,
    employeeId: { $in: lookupKeys },
    date
  }).sort({ createdAt: -1 })

  if (!row) {
    row = await Attendance.create({
      companyId: scope.companyId,
      employeeId: scope.employeeId,
      userId: scope.userId,
      date,
      status: 'absent',
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      markedBy: scope.userId
    })
  }

  row.regularizationRequest = {
    requestType,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString()
  }
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Regularization request submitted successfully',
    data: toRecord(row, date)
  })
})
