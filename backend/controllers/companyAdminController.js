import bcrypt from 'bcryptjs'
import CompanyAdmin from '../models/CompanyAdmin.js'
import TenantCompany from '../models/TenantCompany.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createAdminActivityLog } from '../utils/adminAudit.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const serializeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone,
  role: admin.role,
  status: admin.status,
  lastLogin: admin.lastLogin,
  assignedCompanies: admin.assignedCompanies,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt
})

export const getCompanyAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status, role, company } = req.query
  const query = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  if (status && status !== 'all') query.status = status
  if (role && role !== 'all') query.role = role
  if (company && company !== 'all') query.assignedCompanies = company

  const skip = (Number(page) - 1) * Number(limit)

  const [items, total] = await Promise.all([
    CompanyAdmin.find(query)
      .populate('assignedCompanies', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    CompanyAdmin.countDocuments(query)
  ])

  return res.status(200).json({
    items: items.map(serializeAdmin),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  })
})

export const createCompanyAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, assignedCompanies = [], status = 'active' } = req.body

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'name, email, phone, password and role are required' })
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  const exists = await CompanyAdmin.findOne({ email: email.toLowerCase().trim() })
  if (exists) {
    return res.status(400).json({ message: 'Email is already in use' })
  }

  const hashed = await bcrypt.hash(password, 10)

  const admin = await CompanyAdmin.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password: hashed,
    role,
    assignedCompanies,
    status
  })

  await createAdminActivityLog({
    adminId: admin._id,
    module: 'Admin Management',
    action: 'CREATE',
    description: `Admin ${admin.email} created`,
    performedBy: req.user?._id
  })

  const populated = await CompanyAdmin.findById(admin._id).populate('assignedCompanies', 'name')
  return res.status(201).json({ item: serializeAdmin(populated) })
})

export const getCompanyAdminById = asyncHandler(async (req, res) => {
  const item = await CompanyAdmin.findById(req.params.id).populate('assignedCompanies', 'name')
  if (!item) return res.status(404).json({ message: 'Admin not found' })
  return res.status(200).json({ item: serializeAdmin(item) })
})

export const updateCompanyAdmin = asyncHandler(async (req, res) => {
  const { name, phone, role, assignedCompanies, status } = req.body
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Admin not found' })

  if (name) item.name = name.trim()
  if (phone) item.phone = phone.trim()
  if (role) item.role = role
  if (Array.isArray(assignedCompanies)) item.assignedCompanies = assignedCompanies
  if (status) item.status = status

  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'UPDATE',
    description: `Admin ${item.email} updated`,
    performedBy: req.user?._id
  })

  const populated = await CompanyAdmin.findById(item._id).populate('assignedCompanies', 'name')
  return res.status(200).json({ item: serializeAdmin(populated) })
})

export const deleteCompanyAdmin = asyncHandler(async (req, res) => {
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Admin not found' })

  await CompanyAdmin.deleteOne({ _id: item._id })

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'DELETE',
    description: `Admin ${item.email} deleted`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ message: 'Admin deleted successfully' })
})

export const updateCompanyAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const valid = ['active', 'inactive', 'suspended', 'locked']
  if (!status || !valid.includes(status)) return res.status(400).json({ message: 'Invalid status' })

  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Admin not found' })

  item.status = status
  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'STATUS_CHANGE',
    description: `Admin ${item.email} status changed to ${status}`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ item: serializeAdmin(item) })
})

export const resetCompanyAdminPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }

  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Admin not found' })

  item.password = await bcrypt.hash(password, 10)
  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'RESET_PASSWORD',
    description: `Password reset for ${item.email}`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ message: 'Password reset successfully' })
})

export const assignCompaniesToAdmin = asyncHandler(async (req, res) => {
  const { companyIds = [] } = req.body
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Admin not found' })

  const companies = await TenantCompany.find({ _id: { $in: companyIds } }).select('_id')
  item.assignedCompanies = companies.map((company) => company._id)
  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'ASSIGN_COMPANIES',
    description: `Assigned ${companies.length} companies to ${item.email}`,
    performedBy: req.user?._id
  })

  const populated = await CompanyAdmin.findById(item._id).populate('assignedCompanies', 'name')
  return res.status(200).json({ item: serializeAdmin(populated) })
})

export const listTenantCompanies = asyncHandler(async (_req, res) => {
  let companies = await TenantCompany.find().sort({ name: 1 })

  if (companies.length === 0) {
    companies = await TenantCompany.insertMany([
      { name: 'Acme Corp', domain: 'acme.com' },
      { name: 'Globex', domain: 'globex.io' },
      { name: 'Innotech', domain: 'innotech.ai' }
    ])
  }

  return res.status(200).json({ items: companies })
})
