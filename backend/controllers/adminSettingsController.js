import asyncHandler from '../utils/asyncHandler.js'
import bcrypt from 'bcryptjs'
import CompanySettings from '../models/CompanySettings.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import crypto from 'crypto'

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

  return res.status(200).json({ success: true, message: 'Settings fetched successfully', data: defaultSettingsPayload(item) })
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

  return res.status(200).json({ success: true, message: 'Settings updated successfully', data: defaultSettingsPayload(item) })
})

export const updateCompanyProfile = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'companyProfile', res)) return
  const item = await ensureSettings(req.user.companyId)
  item.companyProfile = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Company profile updated successfully', data: item.companyProfile || {} })
})

export const updateOfficeTiming = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'officeTiming', res)) return
  const item = await ensureSettings(req.user.companyId)
  item.officeTiming = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Office timing updated successfully', data: item.officeTiming || {} })
})

export const updateWorkingDays = asyncHandler(async (req, res) => {
  const { workingDays } = req.body || {}
  if (!Array.isArray(workingDays)) {
    return res.status(400).json({ success: false, message: 'workingDays is required and must be an array' })
  }
  const item = await ensureSettings(req.user.companyId)
  item.workingDays = workingDays
  await item.save()
  return res.status(200).json({ success: true, message: 'Working days updated successfully', data: item.workingDays || [] })
})

export const updateAttendanceRules = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'attendanceRules', res)) return
  const item = await ensureSettings(req.user.companyId)
  item.attendanceRules = req.body
  item.attendancePolicy = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Attendance rules updated successfully', data: item.attendanceRules || {} })
})

export const updateLeavePolicySettings = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'leavePolicy', res)) return
  const item = await ensureSettings(req.user.companyId)
  item.leavePolicy = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Leave policy updated successfully', data: item.leavePolicy || {} })
})

export const updatePayrollSettings = asyncHandler(async (req, res) => {
  if (rejectInvalidObject(req.body, 'payrollSettings', res)) return
  const item = await ensureSettings(req.user.companyId)
  item.payrollSettings = req.body
  item.payrollPolicy = req.body
  await item.save()
  return res.status(200).json({ success: true, message: 'Payroll settings updated successfully', data: item.payrollSettings || {} })
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

  item.holidays = [...(item.holidays || []), holiday]
  await item.save()

  return res.status(201).json({ success: true, message: 'Holiday added successfully', data: holiday })
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

  return res.status(200).json({ success: true, message: 'Holiday deleted successfully', data: { id: holidayId } })
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

  const isHashed = String(user.password || '').startsWith('$2')
  const isPasswordValid = isHashed
    ? await bcrypt.compare(password, user.password)
    : String(password) === String(user.password)

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  user.lastLogin = new Date().toISOString()
  await user.save()

  const token = generateToken({ id: user._id, role: 'admin', companyId: user.companyId })

  return res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        status: user.status
      }
    }
  })
})
