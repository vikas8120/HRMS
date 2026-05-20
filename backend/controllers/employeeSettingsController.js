import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import UserSession from '../models/UserSession.js'

const getEmployeeRow = async (req) => {
  return User.findOne({
    _id: req.user.id,
    companyId: req.user.companyId,
    role: 'employee'
  })
}

const toSession = (row) => ({
  id: String(row._id),
  ipAddress: row.ipAddress || '',
  device: row.device || '',
  active: Boolean(row.active),
  loggedInAt: row.loggedInAt || null,
  loggedOutAt: row.loggedOutAt || null,
  isCurrent: false
})

const serializeSettings = async (user, req) => {
  const rows = await UserSession.find({
    user: String(req.user.id),
    companyId: String(req.user.companyId),
    active: true
  }).sort({ loggedInAt: -1 }).limit(20)

  const currentAgent = String(req.get('user-agent') || '')
  const currentIp = String(req.ip || req.headers['x-forwarded-for'] || '')
  const sessions = rows.map((x) => {
    const item = toSession(x)
    item.isCurrent = item.device === currentAgent && item.ipAddress === currentIp
    return item
  })

  return {
    account: {
      id: String(user._id),
      employeeId: user.employeeId || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'employee',
      companyId: user.companyId || null,
      status: user.status || 'active'
    },
    notificationPreferences: {
      attendance: Boolean(user.notifyAttendance ?? true),
      leave: Boolean(user.notifyLeave ?? true),
      payroll: Boolean(user.notifyPayroll ?? true),
      task: Boolean(user.notifyTask ?? true),
      system: Boolean(user.notifySystem ?? true)
    },
    themePreferences: {
      theme: String(user.theme || 'system'),
      compactMode: Boolean(user.compactMode ?? false),
      language: String(user.language || 'en')
    },
    sessions
  }
}

export const getEmployeeSettings = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee settings not found', data: null })

  const data = await serializeSettings(user, req)
  return res.status(200).json({
    success: true,
    message: 'Employee settings fetched successfully',
    data
  })
})

export const updateEmployeeSettings = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee settings not found', data: null })

  const notificationPreferences = req.body?.notificationPreferences || {}
  const themePreferences = req.body?.themePreferences || {}

  if (notificationPreferences.attendance !== undefined) user.notifyAttendance = Boolean(notificationPreferences.attendance)
  if (notificationPreferences.leave !== undefined) user.notifyLeave = Boolean(notificationPreferences.leave)
  if (notificationPreferences.payroll !== undefined) user.notifyPayroll = Boolean(notificationPreferences.payroll)
  if (notificationPreferences.task !== undefined) user.notifyTask = Boolean(notificationPreferences.task)
  if (notificationPreferences.system !== undefined) user.notifySystem = Boolean(notificationPreferences.system)

  if (themePreferences.theme !== undefined) {
    const allowedThemes = new Set(['light', 'dark', 'system'])
    const theme = String(themePreferences.theme || '').toLowerCase().trim()
    if (!allowedThemes.has(theme)) {
      return res.status(400).json({ success: false, message: 'theme must be light, dark, or system', data: null })
    }
    user.theme = theme
  }
  if (themePreferences.compactMode !== undefined) user.compactMode = Boolean(themePreferences.compactMode)
  if (themePreferences.language !== undefined) user.language = String(themePreferences.language || 'en').trim() || 'en'

  await user.save()

  const data = await serializeSettings(user, req)
  return res.status(200).json({
    success: true,
    message: 'Employee settings updated successfully',
    data
  })
})

export const changeEmployeeSettingsPassword = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee settings not found', data: null })

  const { currentPassword = '', newPassword = '', confirmPassword = '' } = req.body || {}

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword, newPassword, and confirmPassword are required', data: null })
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match', data: null })
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password', data: null })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long', data: null })
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password must include uppercase, lowercase, and number', data: null })
  }

  const storedPassword = String(user.password || '')
  const passOk = storedPassword.startsWith('$2') ? await bcrypt.compare(currentPassword, storedPassword) : false
  if (!passOk) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect', data: null })
  }

  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()

  return res.status(200).json({ success: true, message: 'Password updated successfully', data: null })
})

export const logoutEmployeeOtherDevices = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee settings not found', data: null })

  const currentAgent = String(req.get('user-agent') || '')
  const currentIp = String(req.ip || req.headers['x-forwarded-for'] || '')

  await UserSession.updateMany(
    {
      user: String(req.user.id),
      companyId: String(req.user.companyId),
      active: true,
      $or: [
        { device: { $ne: currentAgent } },
        { ipAddress: { $ne: currentIp } }
      ]
    },
    {
      active: false,
      loggedOutAt: new Date().toISOString()
    }
  )

  return res.status(200).json({
    success: true,
    message: 'Logged out from other devices successfully',
    data: null
  })
})
