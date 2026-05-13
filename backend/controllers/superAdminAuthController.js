import bcrypt from 'bcryptjs'
import SuperAdmin from '../models/SuperAdmin.js'
import asyncHandler from '../utils/asyncHandler.js'
import generateToken from '../utils/generateToken.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

export const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400)
    throw new Error('Email and password are required')
  }

  const user = await SuperAdmin.findOne({ email: email.toLowerCase().trim() })

  if (!user) {
    return respond(res, 401, 'Invalid credentials')
  }

  if (user.role !== 'SUPER_ADMIN') {
    return respond(res, 403, 'Forbidden: only SUPER_ADMIN can login')
  }

  if (user.status !== 'active') {
    return respond(res, 403, `Account is ${user.status}`)
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return respond(res, 401, 'Invalid credentials')
  }

  user.lastLogin = new Date()
  await user.save()

  const token = generateToken({ id: user._id, role: 'platform_admin' })

  return res.status(200).json({
    success: true,
    message: 'Super Admin login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'platform_admin',
        rawRole: user.role,
        companyId: null,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    },
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: 'platform_admin',
      rawRole: user.role,
      companyId: null,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    role: 'platform_admin',
    redirectUrl: '/super-admin/dashboard'
  })
})

export const getCurrentSuperAdmin = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Super Admin profile fetched successfully',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: 'platform_admin',
        rawRole: req.user.role,
        companyId: null,
        status: req.user.status,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    },
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: 'platform_admin',
      rawRole: req.user.role,
      companyId: null,
      status: req.user.status,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    },
    role: 'platform_admin',
    redirectUrl: '/super-admin/dashboard'
  })
})

export const logoutSuperAdmin = asyncHandler(async (_req, res) => {
  return respond(res, 200, 'Logged out successfully')
})
