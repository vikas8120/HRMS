import jwt from 'jsonwebtoken'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import SuperAdmin from '../models/SuperAdmin.js'

export const protectSuperAdmin = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: token missing' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await SuperAdmin.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: user not found' })
    }

    const normalizedRole = String(user.role || '').toUpperCase()
    const tokenRole = String(decoded.role || '').toLowerCase()
    const allowedByToken = tokenRole === 'platform_admin' || tokenRole === 'super_admin' || tokenRole === 'superadmin'

    if (normalizedRole !== 'SUPER_ADMIN' || !allowedByToken) {
      return res.status(403).json({ message: 'Forbidden: role not allowed' })
    }

    req.user = user
    next()
  } catch (_error) {
    return res.status(401).json({ message: 'Unauthorized: invalid or expired token' })
  }
})

export const protectAdmin = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: token missing' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded?.id || decoded?.role !== 'admin' || !decoded?.companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: invalid token payload' })
    }

    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: admin not found' })
    }

    if (String(user.companyId || '') !== String(decoded.companyId)) {
      return res.status(403).json({ success: false, message: 'Forbidden: company mismatch' })
    }

    if (String(user.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: role not allowed' })
    }

    if (String(user.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: `Forbidden: account is ${user.status || 'inactive'}` })
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      status: user.status
    }

    next()
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' })
  }
})
