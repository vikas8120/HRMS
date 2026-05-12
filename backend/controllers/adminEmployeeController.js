import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import ActivityLog from '../models/ActivityLog.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_STATUS = new Set(['active', 'inactive'])

const serializeEmployee = (item) => ({
  id: item._id,
  employeeId: item.employeeId || null,
  name: item.name,
  email: item.email,
  phone: item.phone || '',
  gender: item.gender || '',
  dob: item.dob || null,
  joiningDate: item.joiningDate || null,
  departmentId: item.departmentId || null,
  managerId: item.managerId || null,
  hrId: item.hrId || null,
  designation: item.designation || '',
  salary: Number(item.salary || 0),
  address: item.address || '',
  status: item.status || 'active',
  role: item.role,
  companyId: item.companyId,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const generateEmployeeId = async (companyId) => {
  const totalEmployees = await User.countDocuments({ companyId, role: 'employee' })
  const next = String(totalEmployees + 1).padStart(4, '0')
  return `EMP-${next}`
}

export const listEmployees = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
  const skip = (page - 1) * limit

  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '').trim().toLowerCase()
  const departmentId = String(req.query.departmentId || '').trim()
  const managerId = String(req.query.managerId || '').trim()
  const hrId = String(req.query.hrId || '').trim()

  const query = { companyId, role: 'employee' }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ]
  }

  if (status && ALLOWED_STATUS.has(status)) query.status = status
  if (departmentId && departmentId !== 'all') query.departmentId = departmentId
  if (managerId && managerId !== 'all') query.managerId = managerId
  if (hrId && hrId !== 'all') query.hrId = hrId

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ])

  return res.status(200).json({
    success: true,
    message: 'Employees fetched successfully',
    data: items.map((item) => serializeEmployee(item)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const getEmployeeById = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'employee' })
  if (!item) return res.status(404).json({ success: false, message: 'Employee not found' })

  return res.status(200).json({ success: true, message: 'Employee profile fetched successfully', data: serializeEmployee(item) })
})

export const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone = '',
    password,
    gender = '',
    dob = null,
    joiningDate = null,
    departmentId = null,
    managerId = null,
    hrId = null,
    designation = '',
    salary = 0,
    address = '',
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

  const employeeId = await generateEmployeeId(req.user.companyId)
  const hashed = await bcrypt.hash(password, 10)

  const item = await User.create({
    employeeId,
    companyId: req.user.companyId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: String(phone || '').trim(),
    password: hashed,
    gender,
    dob,
    joiningDate,
    departmentId,
    managerId,
    hrId,
    designation,
    salary: Number(salary || 0),
    address,
    role: 'employee',
    status: normalizedStatus
  })

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'employee',
    action: 'employee_added',
    message: `Employee ${item.name || item.email} added`,
    metadata: { employeeDocId: item._id, employeeId: item.employeeId }
  })

  return res.status(201).json({ success: true, message: 'Employee created successfully', data: serializeEmployee(item) })
})

export const updateEmployee = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'employee' })
  if (!item) return res.status(404).json({ success: false, message: 'Employee not found' })

  const {
    name,
    phone,
    gender,
    dob,
    joiningDate,
    departmentId,
    managerId,
    hrId,
    designation,
    salary,
    address,
    status
  } = req.body

  if (name) item.name = name.trim()
  if (phone !== undefined) item.phone = String(phone || '').trim()
  if (gender !== undefined) item.gender = gender
  if (dob !== undefined) item.dob = dob
  if (joiningDate !== undefined) item.joiningDate = joiningDate
  if (departmentId !== undefined) item.departmentId = departmentId
  if (managerId !== undefined) item.managerId = managerId
  if (hrId !== undefined) item.hrId = hrId
  if (designation !== undefined) item.designation = designation
  if (salary !== undefined) item.salary = Number(salary || 0)
  if (address !== undefined) item.address = address

  if (status !== undefined) {
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' })
    }
    item.status = normalizedStatus
  }

  await item.save()

  return res.status(200).json({ success: true, message: 'Employee updated successfully', data: serializeEmployee(item) })
})

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const normalizedStatus = String(status || '').toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const item = await User.findOne({ _id: req.params.id, companyId: req.user.companyId, role: 'employee' })
  if (!item) return res.status(404).json({ success: false, message: 'Employee not found' })

  item.status = normalizedStatus
  await item.save()

  return res.status(200).json({
    success: true,
    message: `Employee ${normalizedStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: serializeEmployee(item)
  })
})

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await User.deleteOne({ _id: req.params.id, companyId: req.user.companyId, role: 'employee' })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Employee not found' })
  return res.status(200).json({ success: true, message: 'Employee deleted successfully' })
})
