import bcrypt from 'bcryptjs'
import SuperAdmin from '../models/SuperAdmin.js'
import asyncHandler from '../utils/asyncHandler.js'
import generateToken from '../utils/generateToken.js'

export const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400)
    throw new Error('Email and password are required')
  }

  const user = await SuperAdmin.findOne({ email: email.toLowerCase().trim() })

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Forbidden: only SUPER_ADMIN can login' })
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: `Account is ${user.status}` })
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  user.lastLogin = new Date()
  await user.save()

  const token = generateToken({ id: user._id, role: user.role })

  return res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  })
})

export const getCurrentSuperAdmin = asyncHandler(async (req, res) => {
  return res.status(200).json({ user: req.user })
})

export const logoutSuperAdmin = asyncHandler(async (_req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' })
})
