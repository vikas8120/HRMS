import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import asyncHandler from '../utils/asyncHandler.js'
import generateToken from '../utils/generateToken.js'
import SuperAdmin from '../models/SuperAdmin.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import UserSession from '../models/UserSession.js'

const normalizeRole = (role) => String(role || '').trim().toLowerCase()
const normalizeIdentifier = (value) => String(value || '').trim()
const normalizeEmail = (value) => String(value || '').toLowerCase().trim()

const roleToRedirect = (role) => {
  if (role === 'platform_admin') return '/super-admin/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'hr') return '/hr/dashboard'
  if (role === 'manager') return '/manager/dashboard'
  if (role === 'employee') return '/employee/dashboard'
  return '/login'
}

const safeUser = (user, role) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role,
  companyId: user.companyId || null,
  departmentId: user.departmentId || null,
  status: user.status || 'active'
})

const findCompanyUserByIdentifier = async (rawIdentifier) => {
  const identifier = normalizeIdentifier(rawIdentifier)
  const normalizedEmail = normalizeEmail(rawIdentifier)
  if (!identifier) return null

  return User.findOne({
    $or: [
      { email: normalizedEmail },
      { employeeId: identifier },
      { adminId: identifier }
    ]
  })
}

const validateCompanyUserPassword = async (user, password) => {
  const storedPassword = String(user?.password || '')
  const isHashed = storedPassword.startsWith('$2')
  if (!isHashed) {
    return { ok: false, status: 500, message: 'Account password is not securely configured. Contact administrator.' }
  }

  const passOk = await bcrypt.compare(password, storedPassword)
  if (!passOk) {
    return { ok: false, status: 401, message: 'Invalid credentials' }
  }

  return { ok: true, status: 200, message: '' }
}

const createRoleTokenResponse = (user, role) => {
  const token = generateToken(
    { id: user._id, role, companyId: user.companyId || null },
    { expiresIn: '7d' }
  )

  return {
    success: true,
    token,
    user: safeUser(user, role),
    role,
    redirectUrl: roleToRedirect(role)
  }
}

export const login = asyncHandler(async (req, res) => {
  const { email, adminId, identifier, password } = req.body || {}
  const loginIdentifier = normalizeIdentifier(identifier || email || adminId)

  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/adminId and password are required' })
  }

  const normalizedEmail = normalizeEmail(loginIdentifier)

  const [platformAdmin, appUser] = await Promise.all([
    SuperAdmin.findOne({ email: normalizedEmail }),
    findCompanyUserByIdentifier(loginIdentifier)
  ])

  let loggedInUser = null
  let normalizedRole = ''

  if (platformAdmin) {
    const passOk = await bcrypt.compare(password, platformAdmin.password)
    if (!passOk) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (String(platformAdmin.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Account inactive' })
    }

    platformAdmin.lastLogin = new Date().toISOString()
    await platformAdmin.save()
    loggedInUser = platformAdmin
    normalizedRole = 'platform_admin'
  } else if (appUser) {
    const passwordValidation = await validateCompanyUserPassword(appUser, password)
    if (!passwordValidation.ok) {
      return res.status(passwordValidation.status).json({ success: false, message: passwordValidation.message })
    }

    if (String(appUser.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Account inactive' })
    }

    appUser.lastLogin = new Date().toISOString()
    await appUser.save()
    loggedInUser = appUser
    normalizedRole = normalizeRole(appUser.role)

    if (appUser.companyId) {
      await ActivityLog.create({
        companyId: appUser.companyId,
        userId: appUser._id,
        module: 'auth',
        action: 'login_success',
        message: `${appUser.name || appUser.email} logged in`,
        metadata: {
          role: normalizedRole,
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || ''
        }
      })

      await UserSession.create({
        user: String(appUser._id),
        companyId: String(appUser.companyId),
        ipAddress: req.ip || '',
        device: req.get('user-agent') || '',
        active: true,
        loggedInAt: new Date().toISOString(),
        loggedOutAt: null
      })
    }
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  return res.status(200).json(createRoleTokenResponse(loggedInUser, normalizedRole))
})

export const managerLogin = asyncHandler(async (req, res) => {
  const { email, adminId, identifier, password } = req.body || {}
  const loginIdentifier = normalizeIdentifier(identifier || email || adminId)

  if (!loginIdentifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/adminId and password are required' })
  }

  const manager = await findCompanyUserByIdentifier(loginIdentifier)
  if (!manager) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const role = normalizeRole(manager.role)
  if (role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  const passwordValidation = await validateCompanyUserPassword(manager, password)
  if (!passwordValidation.ok) {
    return res.status(passwordValidation.status).json({ success: false, message: passwordValidation.message })
  }

  if (String(manager.status || '').toLowerCase() !== 'active') {
    return res.status(403).json({ success: false, message: 'Account inactive' })
  }

  manager.lastLogin = new Date().toISOString()
  await manager.save()

  if (manager.companyId) {
    await ActivityLog.create({
      companyId: manager.companyId,
      userId: manager._id,
      module: 'auth',
      action: 'manager_login_success',
      message: `${manager.name || manager.email} logged in`,
      metadata: {
        role,
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      }
    })

    await UserSession.create({
      user: String(manager._id),
      companyId: String(manager.companyId),
      ipAddress: req.ip || '',
      device: req.get('user-agent') || '',
      active: true,
      loggedInAt: new Date().toISOString(),
      loggedOutAt: null
    })
  }

  return res.status(200).json(createRoleTokenResponse(manager, 'manager'))
})

export const me = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: token missing' })
  }

  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' })
  }

  if (!decoded?.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token payload' })
  }

  const role = normalizeRole(decoded.role)

  if (role === 'platform_admin' || role === 'super_admin' || role === 'superadmin') {
    const user = await SuperAdmin.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (String(user.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Account inactive' })
    }
    return res.status(200).json({
      success: true,
      user: safeUser(user, 'platform_admin'),
      role: 'platform_admin',
      redirectUrl: roleToRedirect('platform_admin')
    })
  }

  const user = await User.findById(decoded.id).select('-password')
  if (!user) return res.status(401).json({ success: false, message: 'User not found' })
  if (String(user.status || '').toLowerCase() !== 'active') {
    return res.status(403).json({ success: false, message: 'Account inactive' })
  }

  const normalizedUserRole = normalizeRole(user.role)
  return res.status(200).json({
    success: true,
    user: safeUser(user, normalizedUserRole),
    role: normalizedUserRole,
    redirectUrl: roleToRedirect(normalizedUserRole)
  })
})
