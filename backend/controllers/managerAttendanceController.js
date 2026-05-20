import asyncHandler from '../utils/asyncHandler.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['present', 'absent', 'late', 'half-day', 'half day'])
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata'

const toDateKey = (value) => String(value || '').slice(0, 10)

const getHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const inTime = new Date(checkIn).getTime()
  const outTime = new Date(checkOut).getTime()
  if (!Number.isFinite(inTime) || !Number.isFinite(outTime) || outTime <= inTime) return 0
  return Number(((outTime - inTime) / (1000 * 60 * 60)).toFixed(2))
}

const normalizeStatus = (value) => {
  const status = String(value || '').trim().toLowerCase()
  return status === 'half day' ? 'half-day' : status
}

const getCurrentDateKey = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

const getCurrentHourInTimezone = () => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    hour12: false
  })
  return Number(formatter.format(new Date()))
}

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)

  const team = await User.find({
    companyId,
    role: 'employee',
    managerId
  }).select('_id employeeId name email phone departmentId designation')

  const lookupKeys = [...new Set(
    team.flatMap((item) => [String(item._id), String(item.employeeId || '')].filter(Boolean))
  )]

  const employeeMap = {}
  for (const item of team) {
    const value = {
      id: item._id,
      employeeId: item.employeeId || item._id,
      name: item.name || '-',
      email: item.email || '-',
      phone: item.phone || '-',
      departmentId: item.departmentId || null,
      designation: item.designation || '-'
    }
    employeeMap[String(item._id)] = value
    if (item.employeeId) employeeMap[String(item.employeeId)] = value
  }

  return { companyId, managerId, team, lookupKeys, employeeMap }
}

const serializeAttendance = (item, employeeMap = {}) => {
  const key = String(item.employeeId || item.userId || '')
  const employee = employeeMap[key] || {}
  return {
    id: item._id,
    employeeId: employee.employeeId || item.employeeId || item.userId || null,
    employeeName: employee.name || '-',
    email: employee.email || '-',
    phone: employee.phone || '-',
    departmentId: employee.departmentId || null,
    designation: employee.designation || '-',
    date: item.date || null,
    checkIn: item.checkIn || null,
    checkOut: item.checkOut || null,
    workingHours: Number(item.workingHours || getHours(item.checkIn, item.checkOut)),
    status: normalizeStatus(item.status || 'present'),
    markedBy: item.markedBy || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

const buildAttendanceQuery = ({ companyId, lookupKeys, date, month, employeeId, status }) => {
  const query = { companyId, employeeId: { $in: lookupKeys } }
  if (employeeId && employeeId !== 'all') query.employeeId = String(employeeId)
  if (date) query.date = toDateKey(date)
  if (month) {
    const monthKey = String(month).slice(0, 7)
    query.date = { $regex: `^${monthKey}` }
  }
  const normalizedStatus = normalizeStatus(status)
  if (normalizedStatus && normalizedStatus !== 'all' && ALLOWED_STATUS.has(normalizedStatus)) {
    query.status = normalizedStatus
  }
  return query
}

const getSummary = (records) => ({
  total: records.length,
  present: records.filter((x) => x.status === 'present').length,
  absent: records.filter((x) => x.status === 'absent').length,
  late: records.filter((x) => x.status === 'late').length,
  halfDay: records.filter((x) => x.status === 'half-day').length
})

export const getManagerAttendance = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap } = await buildTeamScope(req)
  if (!lookupKeys.length) {
    return res.status(200).json({ success: true, data: [], summary: getSummary([]) })
  }

  const query = buildAttendanceQuery({
    companyId,
    lookupKeys,
    date: req.query.date,
    month: req.query.month,
    employeeId: req.query.employeeId,
    status: req.query.status
  })

  const items = await Attendance.find(query).sort({ date: -1, createdAt: -1 })
  const records = items.map((item) => serializeAttendance(item, employeeMap))
  return res.status(200).json({ success: true, data: records, summary: getSummary(records) })
})

export const getManagerAttendanceToday = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap } = await buildTeamScope(req)
  if (!lookupKeys.length) {
    return res.status(200).json({
      success: true,
      data: [],
      cards: { presentToday: 0, absentToday: 0, lateToday: 0, halfDayToday: 0 }
    })
  }

  const today = getCurrentDateKey()
  const items = await Attendance.find({ companyId, employeeId: { $in: lookupKeys }, date: today }).sort({ createdAt: -1 })
  const records = items.map((item) => serializeAttendance(item, employeeMap))
  const cards = {
    presentToday: records.filter((x) => x.status === 'present').length,
    absentToday: records.filter((x) => x.status === 'absent').length,
    lateToday: records.filter((x) => x.status === 'late').length,
    halfDayToday: records.filter((x) => x.status === 'half-day').length
  }
  return res.status(200).json({ success: true, data: records, cards })
})

export const getManagerEmployeeAttendance = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap } = await buildTeamScope(req)
  const employeeId = String(req.params.employeeId || '').trim()
  if (!employeeId || !lookupKeys.includes(employeeId)) {
    return res.status(404).json({ success: false, message: 'Employee not found in your team scope' })
  }

  const month = String(req.query.month || '').trim()
  const status = String(req.query.status || 'all').trim()
  const query = buildAttendanceQuery({ companyId, lookupKeys, month, employeeId, status })
  const items = await Attendance.find(query).sort({ date: -1, createdAt: -1 }).limit(90)
  const records = items.map((item) => serializeAttendance(item, employeeMap))
  return res.status(200).json({ success: true, data: records, summary: getSummary(records) })
})

export const getManagerAttendanceReports = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap, team } = await buildTeamScope(req)
  if (!lookupKeys.length) return res.status(200).json({ success: true, data: { monthly: [], employee: [] } })

  const month = String(req.query.month || getCurrentDateKey().slice(0, 7)).slice(0, 7)
  const items = await Attendance.find({
    companyId,
    employeeId: { $in: lookupKeys },
    date: { $regex: `^${month}` }
  }).sort({ date: -1, createdAt: -1 })

  const records = items.map((item) => serializeAttendance(item, employeeMap))
  const monthly = [{
    month,
    ...getSummary(records)
  }]

  const employee = team.map((member) => {
    const key1 = String(member._id)
    const key2 = String(member.employeeId || '')
    const scoped = records.filter((x) => String(x.employeeId) === key1 || String(x.employeeId) === key2)
    const summary = getSummary(scoped)
    return {
      employeeId: member.employeeId || member._id,
      employeeName: member.name || '-',
      designation: member.designation || '-',
      ...summary
    }
  })

  return res.status(200).json({ success: true, data: { monthly, employee } })
})

export const getManagerAttendanceAlerts = asyncHandler(async (req, res) => {
  const { companyId, lookupKeys, employeeMap } = await buildTeamScope(req)
  if (!lookupKeys.length) return res.status(200).json({ success: true, data: [] })

  const month = String(req.query.month || getCurrentDateKey().slice(0, 7)).slice(0, 7)
  const items = await Attendance.find({
    companyId,
    employeeId: { $in: lookupKeys },
    date: { $regex: `^${month}` }
  }).sort({ date: -1, createdAt: -1 })

  const records = items.map((item) => serializeAttendance(item, employeeMap))
  const byEmployee = records.reduce((acc, row) => {
    const key = String(row.employeeId || '')
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  const alerts = []
  for (const [employeeId, rows] of Object.entries(byEmployee)) {
    const employeeName = rows[0]?.employeeName || '-'
    const frequentAbsence = rows.filter((x) => x.status === 'absent').length
    const lateCheckin = rows.filter((x) => x.status === 'late').length
    const missingCheckout = rows.filter((x) => x.checkIn && !x.checkOut).length

    if (frequentAbsence >= 3) {
      alerts.push({ id: `abs-${employeeId}`, employeeId, employeeName, type: 'Frequent absence', count: frequentAbsence, severity: 'warning' })
    }
    if (lateCheckin >= 3) {
      alerts.push({ id: `late-${employeeId}`, employeeId, employeeName, type: 'Late check-in', count: lateCheckin, severity: 'warning' })
    }
    if (missingCheckout >= 2) {
      alerts.push({ id: `miss-${employeeId}`, employeeId, employeeName, type: 'Missing checkout', count: missingCheckout, severity: 'danger' })
    }
  }

  await ActivityLog.create({
    companyId,
    userId: req.user.id,
    module: 'manager_attendance',
    action: 'alerts_viewed',
    message: `Manager viewed attendance alerts for ${month}`,
    metadata: { month, alerts: alerts.length }
  })

  return res.status(200).json({ success: true, data: alerts })
})

const getManagerProfile = async (req) => {
  const manager = await User.findOne({
    _id: req.user.id,
    companyId: req.user.companyId,
    role: 'manager'
  }).select('_id employeeId name designation')

  if (!manager) return null
  return {
    id: String(manager._id),
    employeeId: String(manager.employeeId || manager._id),
    name: manager.name || 'Manager',
    designation: manager.designation || 'Manager'
  }
}

const upsertManagerAttendanceRecord = async ({ companyId, managerKey, status, checkIn, checkOut }) => {
  const today = getCurrentDateKey()
  const managerKeys = [...new Set([String(managerKey.employeeId), String(managerKey.id)])]
  const existing = await Attendance.findOne({
    companyId,
    employeeId: { $in: managerKeys },
    date: today
  })

  const payload = {
    companyId,
    employeeId: managerKey.employeeId,
    userId: managerKey.id,
    date: today,
    status,
    checkIn: checkIn || existing?.checkIn || null,
    checkOut: checkOut || existing?.checkOut || null,
    markedBy: managerKey.id
  }

  if (payload.checkIn && payload.checkOut) {
    payload.workingHours = getHours(payload.checkIn, payload.checkOut)
  } else {
    payload.workingHours = Number(existing?.workingHours || 0)
  }

  if (!existing) return Attendance.create(payload)
  Object.assign(existing, payload)
  await existing.save()
  return existing
}

export const getManagerMyAttendanceToday = asyncHandler(async (req, res) => {
  const managerKey = await getManagerProfile(req)
  if (!managerKey) return res.status(404).json({ success: false, message: 'Manager profile not found' })

  const today = getCurrentDateKey()
  const managerKeys = [...new Set([String(managerKey.employeeId), String(managerKey.id)])]
  const row = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId: { $in: managerKeys },
    date: today
  })

  const data = row
    ? {
      id: row._id,
      date: row.date || today,
      status: normalizeStatus(row.status || 'absent'),
      checkIn: row.checkIn || null,
      checkOut: row.checkOut || null,
      workingHours: Number(row.workingHours || getHours(row.checkIn, row.checkOut))
    }
    : {
      id: null,
      date: today,
      status: 'absent',
      checkIn: null,
      checkOut: null,
      workingHours: 0
    }

  return res.status(200).json({ success: true, data })
})

export const managerPunchInAttendance = asyncHandler(async (req, res) => {
  const managerKey = await getManagerProfile(req)
  if (!managerKey) return res.status(404).json({ success: false, message: 'Manager profile not found' })

  const now = new Date()
  const today = getCurrentDateKey()
  const managerKeys = [...new Set([String(managerKey.employeeId), String(managerKey.id)])]
  const existing = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId: { $in: managerKeys },
    date: today
  })
  if (existing?.checkIn) {
    return res.status(400).json({ success: false, message: 'Already punched in for today' })
  }

  const status = getCurrentHourInTimezone() >= 10 ? 'late' : 'present'
  const row = await upsertManagerAttendanceRecord({
    companyId: req.user.companyId,
    managerKey,
    status,
    checkIn: now.toISOString(),
    checkOut: null
  })

  return res.status(200).json({
    success: true,
    message: 'Punch-in recorded successfully',
    data: {
      id: row._id,
      date: row.date || today,
      status: normalizeStatus(row.status || status),
      checkIn: row.checkIn || null,
      checkOut: row.checkOut || null,
      workingHours: Number(row.workingHours || 0)
    }
  })
})

export const managerPunchOutAttendance = asyncHandler(async (req, res) => {
  const managerKey = await getManagerProfile(req)
  if (!managerKey) return res.status(404).json({ success: false, message: 'Manager profile not found' })

  const now = new Date()
  const today = getCurrentDateKey()
  const managerKeys = [...new Set([String(managerKey.employeeId), String(managerKey.id)])]
  const existing = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId: { $in: managerKeys },
    date: today
  })

  if (!existing?.checkIn) {
    return res.status(400).json({ success: false, message: 'Punch-in required before punch-out' })
  }
  if (existing?.checkOut) {
    return res.status(400).json({ success: false, message: 'Already punched out for today' })
  }

  const outTime = now.toISOString()
  const workingHours = getHours(existing.checkIn, outTime)
  const nextStatus = workingHours < 4 ? 'half-day' : normalizeStatus(existing.status || 'present')

  const row = await upsertManagerAttendanceRecord({
    companyId: req.user.companyId,
    managerKey,
    status: nextStatus,
    checkIn: existing.checkIn,
    checkOut: outTime
  })

  row.workingHours = workingHours
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Punch-out recorded successfully',
    data: {
      id: row._id,
      date: row.date || today,
      status: normalizeStatus(row.status || nextStatus),
      checkIn: row.checkIn || null,
      checkOut: row.checkOut || null,
      workingHours: Number(row.workingHours || workingHours)
    }
  })
})
