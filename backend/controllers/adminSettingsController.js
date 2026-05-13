import asyncHandler from '../utils/asyncHandler.js'
import bcrypt from 'bcryptjs'
import CompanySettings from '../models/CompanySettings.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import crypto from 'crypto'
import AdminAccessLog from '../models/AdminAccessLog.js'

const defaultSettingsPayload = (item) => ({
  id: item._id,
  companyId: item.companyId,
  companyProfile: item.companyProfile || {},
  officeTiming: item.officeTiming || {},
  workingDays: Array.isArray(item.workingDays) ? item.workingDays : [],
  attendanceRules: item.attendanceRules || item.attendancePolicy || {},
  leavePolicy: item.leavePolicy || {},
  payrollSettings: item.payrollSettings || item.payrollPolicy || {},
  holidays: Array.isArray(item.holidays) ? item.holidays : [],
  timezone: item.timezone,
  currency: item.currency
})

const ensureSettings = async (companyId) => {
  let item = await CompanySettings.findOne({ companyId })
  if (!item) item = await CompanySettings.create({ companyId, holidays: [] })
  if (!Array.isArray(item.holidays)) item.holidays = []
  return item
}

const rejectInvalidObject = (value, fieldName, res) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    res.status(400).json({ success: false, message: `${fieldName} is required and must be an object` })
    return true
  }
  return false
}

export const getSettings = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const item = await ensureSettings(companyId)

  const payload = defaultSettingsPayload(item)
  return res.status(200).json({ success: true, message: 'Settings fetched successfully', data: payload, item: payload })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const item = await ensureSettings(companyId)

  const {
    timezone,
    currency,
    attendancePolicy,
    leavePolicy,
    payrollPolicy,
    companyProfile,
    officeTiming,
    workingDays,
    attendanceRules,
    payrollSettings,
    holidays
  } = req.body
  if (timezone !== undefined) item.timezone = timezone
  if (currency !== undefined) item.currency = currency
  if (attendancePolicy !== undefined) item.attendancePolicy = attendancePolicy
  if (leavePolicy !== undefined) item.leavePolicy = leavePolicy
  if (payrollPolicy !== undefined) item.payrollPolicy = payrollPolicy
  if (companyProfile !== undefined) item.companyProfile = companyProfile
  if (officeTiming !== undefined) item.officeTiming = officeTiming
  if (workingDays !== undefined) item.workingDays = Array.isArray(workingDays) ? workingDays : []
  if (attendanceRules !== undefined) item.attendanceRules = attendanceRules
  if (payrollSettings !== undefined) item.payrollSettings = payrollSettings
  if (holidays !== undefined) item.holidays = Array.isArray(holidays) ? holidays : []

  await item.save()

  const payload = defaultSettingsPayload(item)
  return res.status(200).json({ success: true, message: 'Settings updated successfully', data: payload, item: payload })
})

export const updateCompanyProfile = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'companyProfile', res)) return
  if (!String(req.body.name || '').trim() || !String(req.body.email || '').trim()) {
    return res.status(400).json({ success: false, message: 'Company name and email are required' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.companyProfile = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Company profile updated successfully', data: item.companyProfile || {}, item: item.companyProfile || {} })
})

export const updateOfficeTiming = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'officeTiming', res)) return
  const start = String(req.body.startTime || '').trim()
  const end = String(req.body.endTime || '').trim()
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'startTime and endTime are required' })
  }
  if (end <= start) {
    return res.status(400).json({ success: false, message: 'endTime must be after startTime' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.officeTiming = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Office timing updated successfully', data: item.officeTiming || {}, item: item.officeTiming || {} })
})

export const updateWorkingDays = asyncHandler(async (req, res) => {
  const { workingDays } = req.body || {}
  if (!Array.isArray(workingDays)) {
    return res.status(400).json({ success: false, message: 'workingDays is required and must be an array' })
  }
  if (!workingDays.length) {
    return res.status(400).json({ success: false, message: 'At least one working day is required' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.workingDays = workingDays
  await item.save()
  return res.status(200).json({ success: true, message: 'Working days updated successfully', data: item.workingDays || [], items: item.workingDays || [] })
})

export const updateAttendanceRules = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'attendanceRules', res)) return
  const workHoursPerDay = Number(req.body.workHoursPerDay)
  const graceMinutes = Number(req.body.graceMinutes)
  const halfDayHours = Number(req.body.halfDayHours)
  if (![workHoursPerDay, graceMinutes, halfDayHours].every((n) => Number.isFinite(n) && n >= 0)) {
    return res.status(400).json({ success: false, message: 'workHoursPerDay, graceMinutes and halfDayHours must be non-negative numbers' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.attendanceRules = { workHoursPerDay, graceMinutes, halfDayHours }
  item.attendancePolicy = { workHoursPerDay, graceMinutes, halfDayHours }
  await item.save()
  return res.status(200).json({ success: true, message: 'Attendance rules updated successfully', data: item.attendanceRules || {}, item: item.attendanceRules || {} })
})

export const updateLeavePolicySettings = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'leavePolicy', res)) return
  const casual = Number(req.body.casual)
  const sick = Number(req.body.sick)
  const earned = Number(req.body.earned)
  if (![casual, sick, earned].every((n) => Number.isFinite(n) && n >= 0)) {
    return res.status(400).json({ success: false, message: 'casual, sick and earned must be non-negative numbers' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.leavePolicy = { casual, sick, earned }
  await item.save()
  return res.status(200).json({ success: true, message: 'Leave policy updated successfully', data: item.leavePolicy || {}, item: item.leavePolicy || {} })
})

export const updatePayrollSettings = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'payrollSettings', res)) return
  const payDay = Number(req.body.payDay)
  const pfEnabled = Boolean(req.body.pfEnabled)
  const pfPercent = Number(req.body.pfPercent)
  const esiEnabled = Boolean(req.body.esiEnabled)
  const esiPercent = Number(req.body.esiPercent)
  if (!Number.isFinite(payDay) || payDay < 1 || payDay > 31) {
    return res.status(400).json({ success: false, message: 'payDay must be between 1 and 31' })
  }
  if (![pfPercent, esiPercent].every((n) => Number.isFinite(n) && n >= 0)) {
    return res.status(400).json({ success: false, message: 'pfPercent and esiPercent must be non-negative numbers' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.payrollSettings = { payDay, pfEnabled, pfPercent, esiEnabled, esiPercent }
  item.payrollPolicy = { payDay, pfEnabled, pfPercent, esiEnabled, esiPercent }
  await item.save()
  return res.status(200).json({ success: true, message: 'Payroll settings updated successfully', data: item.payrollSettings || {}, item: item.payrollSettings || {} })
})

export const addHoliday = asyncHandler(async (req, res) => {
  const { name, date, type = '', description = '' } = req.body || {}
  if (!name || !date) {
    return res.status(400).json({ success: false, message: 'name and date are required' })
  }

  const item = await ensureSettings(req.user.companyId)
  const holiday = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    date: String(date).slice(0, 10),
    type: String(type || '').trim(),
    description: String(description || '').trim()
  }
  const duplicate = (item.holidays || []).some((row) => String(row.date || '').slice(0, 10) === holiday.date && String(row.name || '').trim().toLowerCase() === holiday.name.toLowerCase())
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'Holiday already exists for this date' })
  }

  item.holidays = [...(item.holidays || []), holiday]
  await item.save()

  return res.status(201).json({ success: true, message: 'Holiday added successfully', data: holiday, item: holiday })
})

export const deleteHoliday = asyncHandler(async (req, res) => {
  const holidayId = String(req.params.id || '').trim()
  if (!holidayId) return res.status(400).json({ success: false, message: 'Holiday id is required' })

  const item = await ensureSettings(req.user.companyId)
  const before = item.holidays || []
  const after = before.filter((holiday) => String(holiday.id || '') !== holidayId)

  if (before.length === after.length) {
    return res.status(404).json({ success: false, message: 'Holiday not found' })
  }

  item.holidays = after
  await item.save()

  return res.status(200).json({ success: true, message: 'Holiday deleted successfully', data: { id: holidayId }, item: { id: holidayId } })
})

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' })

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  if (String(user.status || '').toLowerCase() !== 'active') {
    return res.status(403).json({ success: false, message: 'Account disabled' })
  }

  const isHashed = String(user.password || '').startsWith('$2')
  if (!isHashed) {
    return res.status(500).json({ success: false, message: 'Account password is not securely configured. Contact administrator.' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  user.lastLogin = new Date().toISOString()
  await user.save()

  await AdminAccessLog.create({
    admin: user._id,
    adminName: user.name,
    adminEmail: user.email,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    action: 'login'
  })

  const token = generateToken({ id: user._id, role: 'admin', companyId: user.companyId })
  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    status: user.status
  }

  return res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token,
    user: userPayload,
    role: 'admin',
    redirectUrl: '/admin/dashboard',
    data: {
      token,
      user: userPayload
    }
  })
})
