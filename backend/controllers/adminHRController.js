import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_STATUS = new Set(['active', 'inactive'])

const serializeHR = (item) => ({
  id: item._id,
  name: item.name,
  email: item.email,
  phone: item.phone || '',
  departmentId: item.departmentId || null,
  status: item.status || 'active',
  role: item.role,
  companyId: item.companyId,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const listHR = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
  const skip = (page - 1) * limit
  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '').trim().toLowerCase()

  const query = { companyId, role: 'hr' }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  if (status && ALLOWED_STATUS.has(status)) {
    query.status = status
  }

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ])

  return res.status(200).json({
    success: true,
    message: 'HR list fetched successfully',
    data: items.map(serializeHR),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const getHRById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const item = await User.findOne({ _id: id, companyId: req.user.companyId, role: 'hr' })
  if (!item) return res.status(404).json({ success: false, message: 'HR record not found' })

  return res.status(200).json({ success: true, message: 'HR fetched successfully', data: serializeHR(item) })
})

export const createHR = asyncHandler(async (req, res) => {
  const { name, email, password, phone = '', departmentId = null, status = 'active' } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' })
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' })
  }
  if (!ALLOWED_STATUS.has(String(status).toLowerCase())) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' })

  const hashed = await bcrypt.hash(password, 10)

  const item = await User.create({
    companyId: req.user.companyId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    phone: String(phone || '').trim(),
    departmentId,
    role: 'hr',
    status: String(status).toLowerCase()
  })

  return res.status(201).json({ success: true, message: 'HR created successfully', data: serializeHR(item) })
})

export const updateHR = asyncHandler(async (req, res) => {
  const { id } = req.params
  const item = await User.findOne({ _id: id, companyId: req.user.companyId, role: 'hr' })
  if (!item) return res.status(404).json({ success: false, message: 'HR record not found' })

  const { name, phone, departmentId, status } = req.body
  if (name) item.name = name.trim()
  if (phone != null) item.phone = String(phone).trim()
  if (departmentId !== undefined) item.departmentId = departmentId
  if (status !== undefined) {
    const normalized = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalized)) {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' })
    }
    item.status = normalized
  }
  await item.save()

  return res.status(200).json({ success: true, message: 'HR updated successfully', data: serializeHR(item) })
})

export const updateHRStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const normalized = String(status || '').toLowerCase()
  if (!ALLOWED_STATUS.has(normalized)) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const item = await User.findOne({ _id: id, companyId: req.user.companyId, role: 'hr' })
  if (!item) return res.status(404).json({ success: false, message: 'HR record not found' })

  item.status = normalized
  await item.save()

  return res.status(200).json({
    success: true,
    message: `HR ${normalized === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: serializeHR(item)
  })
})

export const deleteHR = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await User.deleteOne({ _id: id, companyId: req.user.companyId, role: 'hr' })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'HR record not found' })
  return res.status(200).json({ success: true, message: 'HR deleted successfully' })
})
