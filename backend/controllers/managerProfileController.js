import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import UserSession from '../models/UserSession.js'

const serializeProfile = (user) => ({
  id: user._id,
  name: user.name || '',
  email: user.email || '',
  role: user.role || 'manager',
  companyId: user.companyId || null,
  departmentId: user.departmentId || null,
  phone: user.phone || '',
  designation: user.designation || '',
  address: user.address || '',
  profileImage: user.profileImage || user.avatar || '',
  status: user.status || 'active',
  lastLogin: user.lastLogin || null
})

const getManagerRow = async (req) => {
  return User.findOne({
    _id: req.user.id,
    companyId: req.user.companyId,
    role: 'manager'
  })
}

export const getManagerProfile = asyncHandler(async (req, res) => {
  const user = await getManagerRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Manager not found' })
  return res.status(200).json({ success: true, data: serializeProfile(user) })
})

export const updateManagerProfile = asyncHandler(async (req, res) => {
  const user = await getManagerRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Manager not found' })

  const { name, phone, designation, address, profileImage } = req.body || {}
  if (name !== undefined) user.name = String(name || '').trim()
  if (phone !== undefined) user.phone = String(phone || '').trim()
  if (designation !== undefined) user.designation = String(designation || '').trim()
  if (address !== undefined) user.address = String(address || '').trim()
  if (profileImage !== undefined) user.profileImage = String(profileImage || '').trim()

  if (!String(user.name || '').trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' })
  }

  await user.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_profile',
    action: 'profile_updated',
    message: 'Manager updated profile settings',
    metadata: { hasProfileImage: Boolean(user.profileImage) }
  })

  return res.status(200).json({ success: true, message: 'Profile updated successfully', data: serializeProfile(user) })
})

export const uploadManagerProfileImage = asyncHandler(async (req, res) => {
  const user = await getManagerRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Manager not found' })
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' })
  if (!String(req.file.mimetype || '').startsWith('image/')) {
    return res.status(400).json({ success: false, message: 'Only image files are allowed for profile photo' })
  }

  const fileUrl = `/uploads/documents/${req.file.filename}`
  user.profileImage = fileUrl
  await user.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_profile',
    action: 'profile_image_updated',
    message: 'Manager updated profile image',
    metadata: { fileUrl }
  })

  return res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully',
    file: {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl
    },
    data: serializeProfile(user)
  })
})

export const changeManagerPassword = asyncHandler(async (req, res) => {
  const user = await getManagerRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Manager not found' })

  const { currentPassword = '', newPassword = '', confirmPassword = '' } = req.body || {}
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword, newPassword, and confirmPassword are required' })
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match' })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' })
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password must include uppercase, lowercase, and number' })
  }

  const storedPassword = String(user.password || '')
  const passOk = storedPassword.startsWith('$2') ? await bcrypt.compare(currentPassword, storedPassword) : false
  if (!passOk) return res.status(400).json({ success: false, message: 'Current password is incorrect' })

  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_profile',
    action: 'password_changed',
    message: 'Manager changed account password',
    metadata: {}
  })

  return res.status(200).json({ success: true, message: 'Password updated successfully' })
})

export const getManagerLoginActivity = asyncHandler(async (req, res) => {
  const rows = await ActivityLog.find({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'auth',
    action: { $in: ['manager_login_success', 'login_success'] }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('_id action message metadata createdAt')

  return res.status(200).json({
    success: true,
    data: rows.map((x) => ({
      id: x._id,
      action: x.action || '',
      message: x.message || '',
      ipAddress: x.metadata?.ipAddress || '',
      userAgent: x.metadata?.userAgent || '',
      createdAt: x.createdAt || null
    }))
  })
})

export const logoutManagerOtherDevices = asyncHandler(async (req, res) => {
  await UserSession.updateMany(
    { user: req.user.id, active: true },
    { active: false, loggedOutAt: new Date().toISOString() }
  )

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_profile',
    action: 'logout_other_devices',
    message: 'Manager requested logout from other devices',
    metadata: {}
  })

  return res.status(200).json({ success: true, message: 'Logged out from other devices successfully' })
})
