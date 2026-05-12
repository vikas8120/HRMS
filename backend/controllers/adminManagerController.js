import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_STATUS = new Set(['active', 'inactive'])

const serializeManager = (item, team = null) => ({
  id: item._id,
  name: item.name,
  email: item.email,
  phone: item.phone || '',
  departmentId: item.departmentId || null,
  assignedEmployees: Array.isArray(item.assignedEmployees) ? item.assignedEmployees : [],
  status: item.status || 'active',
  role: item.role,
  companyId: item.companyId,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
  ...(team ? { team } : {})
})

export const listManagers = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
  const skip = (page - 1) * limit
  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '').trim().toLowerCase()

  const query = { companyId, role: 'manager' }

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
    message: 'Managers fetched successfully',
    data: items.map((item) => serializeManager(item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const getManagerById = asyncHandler(async (req, res) => {
  const manager = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'manager' })
  if (!manager) return res.status(404).json({ success: false, message: 'Manager not found' })

  const assignedIds = Array.isArray(manager.assignedEmployees) ? manager.assignedEmployees.map(String) : []
  const team = assignedIds.length
    ? await User.find({ _id: { $in: assignedIds }, companyId: req.user.companyId, role: 'employee' }).select('name email phone departmentId status')
    : []

  return res.status(200).json({
    success: true,
    message: 'Manager fetched successfully',
    data: serializeManager(manager, team.map((member) => ({
      id: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      departmentId: member.departmentId || null,
      status: member.status || 'active'
    })))
  })
})

export const createManager = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone = '',
    departmentId = null,
    assignedEmployees = [],
    status = 'active'
  } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' })
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' })
  }

  const normalizedStatus = String(status).toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' })

  const hashed = await bcrypt.hash(password, 10)

  const employeeIds = Array.isArray(assignedEmployees) ? assignedEmployees.map(String) : []
  const validEmployees = employeeIds.length
    ? await User.find({ _id: { $in: employeeIds }, companyId: req.user.companyId, role: 'employee' }).select('_id')
    : []

  const validEmployeeIds = validEmployees.map((employee) => String(employee._id))

  const item = await User.create({
    companyId: req.user.companyId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    phone: String(phone || '').trim(),
    departmentId,
    assignedEmployees: validEmployeeIds,
    role: 'manager',
    status: normalizedStatus
  })

  return res.status(201).json({ success: true, message: 'Manager created successfully', data: serializeManager(item) })
})

export const updateManager = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'manager' })
  if (!item) return res.status(404).json({ success: false, message: 'Manager not found' })

  const { name, phone, departmentId, status } = req.body
  if (name) item.name = name.trim()
  if (phone != null) item.phone = String(phone).trim()
  if (departmentId !== undefined) item.departmentId = departmentId
  if (status !== undefined) {
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' })
    }
    item.status = normalizedStatus
  }

  await item.save()

  return res.status(200).json({ success: true, message: 'Manager updated successfully', data: serializeManager(item) })
})

export const updateManagerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const normalizedStatus = String(status || '').toLowerCase()

  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const item = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'manager' })
  if (!item) return res.status(404).json({ success: false, message: 'Manager not found' })

  item.status = normalizedStatus
  await item.save()

  return res.status(200).json({
    success: true,
    message: `Manager ${normalizedStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: serializeManager(item)
  })
})

export const assignEmployeesToManager = asyncHandler(async (req, res) => {
  const { assignedEmployees = [] } = req.body
  if (!Array.isArray(assignedEmployees)) {
    return res.status(400).json({ success: false, message: 'assignedEmployees must be an array' })
  }

  const manager = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'manager' })
  if (!manager) return res.status(404).json({ success: false, message: 'Manager not found' })

  const requestedIds = assignedEmployees.map(String)
  const validEmployees = requestedIds.length
    ? await User.find({ _id: { $in: requestedIds }, companyId: req.user.companyId, role: 'employee' }).select('_id')
    : []

  const validEmployeeIds = validEmployees.map((employee) => String(employee._id))

  manager.assignedEmployees = validEmployeeIds
  await manager.save()

  return res.status(200).json({
    success: true,
    message: 'Employees assigned to manager successfully',
    data: serializeManager(manager)
  })
})

export const deleteManager = asyncHandler(async (req, res) => {
  const result = await User.deleteOne({ _id: req.params.id, companyId: req.user.companyId, role: 'manager' })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Manager not found' })
  return res.status(200).json({ success: true, message: 'Manager deleted successfully' })
})
