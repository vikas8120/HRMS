import asyncHandler from '../utils/asyncHandler.js'
import Department from '../models/Department.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['active', 'inactive'])

const serializeDepartment = (item, employeeCount = 0) => ({
  id: item._id,
  name: item.name,
  description: item.description || '',
  departmentHead: item.departmentHead || null,
  status: item.status || 'active',
  companyId: item.companyId,
  employeeCount,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const serializeEmployee = (item) => ({
  id: item._id,
  employeeId: item.employeeId || null,
  name: item.name,
  email: item.email,
  phone: item.phone || '',
  designation: item.designation || '',
  status: item.status || 'active',
  joiningDate: item.joiningDate || null,
  managerId: item.managerId || null,
  hrId: item.hrId || null,
  departmentId: item.departmentId || null,
  companyId: item.companyId,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const listDepartments = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '').trim().toLowerCase()

  const query = { companyId }

  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  if (status && ALLOWED_STATUS.has(status)) {
    query.status = status
  }

  const items = await Department.find(query).sort({ createdAt: -1 })
  const employees = await User.find({ companyId, role: 'employee' }).select('departmentId')

  const countByDepartment = {}
  for (const employee of employees) {
    const key = String(employee.departmentId || '')
    if (!key) continue
    countByDepartment[key] = (countByDepartment[key] || 0) + 1
  }

  const data = items.map((item) => serializeDepartment(item, countByDepartment[String(item._id)] || 0))

  return res.status(200).json({ success: true, message: 'Departments fetched successfully', data })
})

export const getDepartmentById = asyncHandler(async (req, res) => {
  const item = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Department not found' })

  const employeeCount = await User.countDocuments({ companyId: req.user.companyId, role: 'employee', departmentId: item._id })

  return res.status(200).json({
    success: true,
    message: 'Department fetched successfully',
    data: serializeDepartment(item, employeeCount)
  })
})

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, description = '', departmentHead = null, status = 'active' } = req.body
  if (!name) return res.status(400).json({ success: false, message: 'name is required' })

  const normalizedStatus = String(status).toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'status must be active or inactive' })
  }

  const exists = await Department.findOne({ companyId: req.user.companyId, name: name.trim() })
  if (exists) return res.status(409).json({ success: false, message: 'Department already exists' })

  const item = await Department.create({
    companyId: req.user.companyId,
    name: name.trim(),
    description,
    departmentHead,
    status: normalizedStatus
  })

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'department',
    action: 'department_created',
    message: `Department ${item.name} created`,
    metadata: { departmentId: item._id }
  })

  return res.status(201).json({ success: true, message: 'Department created successfully', data: serializeDepartment(item, 0) })
})

export const updateDepartment = asyncHandler(async (req, res) => {
  const item = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Department not found' })

  const { name, description, departmentHead, status } = req.body
  if (name) item.name = name.trim()
  if (description !== undefined) item.description = description
  if (departmentHead !== undefined) item.departmentHead = departmentHead
  if (status !== undefined) {
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' })
    }
    item.status = normalizedStatus
  }

  await item.save()

  const employeeCount = await User.countDocuments({ companyId: req.user.companyId, role: 'employee', departmentId: item._id })

  return res.status(200).json({ success: true, message: 'Department updated successfully', data: serializeDepartment(item, employeeCount) })
})

export const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await Department.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Department not found' })
  return res.status(200).json({ success: true, message: 'Department deleted successfully' })
})

export const getDepartmentEmployees = asyncHandler(async (req, res) => {
  const department = await Department.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!department) return res.status(404).json({ success: false, message: 'Department not found' })

  const employees = await User.find({
    companyId: req.user.companyId,
    role: 'employee',
    departmentId: department._id
  }).sort({ createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Department employees fetched successfully',
    data: {
      department: serializeDepartment(department, employees.length),
      employees: employees.map((item) => serializeEmployee(item)),
      totalEmployees: employees.length
    }
  })
})
