import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import asyncHandler from '../utils/asyncHandler.js'
import generateToken from '../utils/generateToken.js'
import SuperAdmin from '../models/SuperAdmin.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const normalizeRole = (role) => String(role || '').trim().toLowerCase()

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
  status: user.status || 'active'
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const normalizedEmail = String(email).toLowerCase().trim()

  const [platformAdmin, appUser] = await Promise.all([
    SuperAdmin.findOne({ email: normalizedEmail }),
    User.findOne({ email: normalizedEmail })
  ])

  let loggedInUser = null
  let normalizedRole = ''

  if (platformAdmin) {
    const passOk = await bcrypt.compare(password, platformAdmin.password)
    if (!passOk) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (String(platformAdmin.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Account disabled' })
    }
    platformAdmin.lastLogin = new Date().toISOString()
    await platformAdmin.save()
    loggedInUser = platformAdmin
    normalizedRole = 'platform_admin'
  } else if (appUser) {
    const storedPassword = String(appUser.password || '')
    const isHashed = storedPassword.startsWith('$2')
    const passOk = isHashed ? await bcrypt.compare(password, storedPassword) : storedPassword === String(password)
    if (!passOk) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (String(appUser.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Account disabled' })
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
    }
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }

  const redirectUrl = roleToRedirect(normalizedRole)
  const token = generateToken(
    { id: loggedInUser._id, role: normalizedRole, companyId: loggedInUser.companyId || null },
    { expiresIn: '7d' }
  )

  return res.status(200).json({
    success: true,
    token,
    user: safeUser(loggedInUser, normalizedRole),
    role: normalizedRole,
    redirectUrl
  })
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

  const role = normalizeRole(decoded.role)

  if (role === 'platform_admin') {
    const user = await SuperAdmin.findById(decoded.id).select('-password')
    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    return res.status(200).json({
      success: true,
      user: safeUser(user, 'platform_admin'),
      role: 'platform_admin',
      redirectUrl: roleToRedirect('platform_admin')
    })
  }

  const user = await User.findById(decoded.id).select('-password')
  if (!user) return res.status(401).json({ success: false, message: 'User not found' })

  const normalizedUserRole = normalizeRole(user.role)
  return res.status(200).json({
    success: true,
    user: safeUser(user, normalizedUserRole),
    role: normalizedUserRole,
    redirectUrl: roleToRedirect(normalizedUserRole)
  })
})
