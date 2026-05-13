import bcrypt from 'bcryptjs'
import CompanyAdmin from '../models/CompanyAdmin.js'
import TenantCompany from '../models/TenantCompany.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createAdminActivityLog } from '../utils/adminAudit.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

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

  const data = items.map(serializeAdmin)
  return respond(res, 200, 'Company admins fetched successfully', {
    data,
    items: data,
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
    return respond(res, 400, 'name, email, phone, password and role are required')
  }

  if (!EMAIL_REGEX.test(email)) {
    return respond(res, 400, 'Invalid email format')
  }

  const exists = await CompanyAdmin.findOne({ email: email.toLowerCase().trim() })
  if (exists) {
    return respond(res, 400, 'Email is already in use')
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
  const data = serializeAdmin(populated)
  return respond(res, 201, 'Company admin created successfully', { data, item: data })
})

export const getCompanyAdminById = asyncHandler(async (req, res) => {
  const item = await CompanyAdmin.findById(req.params.id).populate('assignedCompanies', 'name')
  if (!item) return respond(res, 404, 'Admin not found')
  const data = serializeAdmin(item)
  return respond(res, 200, 'Company admin fetched successfully', { data, item: data })
})

export const updateCompanyAdmin = asyncHandler(async (req, res) => {
  const { name, phone, role, assignedCompanies, status } = req.body
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return respond(res, 404, 'Admin not found')

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
  const data = serializeAdmin(populated)
  return respond(res, 200, 'Company admin updated successfully', { data, item: data })
})

export const deleteCompanyAdmin = asyncHandler(async (req, res) => {
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return respond(res, 404, 'Admin not found')

  await CompanyAdmin.deleteOne({ _id: item._id })

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'DELETE',
    description: `Admin ${item.email} deleted`,
    performedBy: req.user?._id
  })

  return respond(res, 200, 'Admin deleted successfully')
})

export const updateCompanyAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const valid = ['active', 'inactive', 'suspended', 'locked']
  if (!status || !valid.includes(status)) return respond(res, 400, 'Invalid status')

  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return respond(res, 404, 'Admin not found')

  item.status = status
  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'STATUS_CHANGE',
    description: `Admin ${item.email} status changed to ${status}`,
    performedBy: req.user?._id
  })

  const data = serializeAdmin(item)
  return respond(res, 200, 'Company admin status updated successfully', { data, item: data })
})

export const resetCompanyAdminPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 6) {
    return respond(res, 400, 'Password must be at least 6 characters')
  }

  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return respond(res, 404, 'Admin not found')

  item.password = await bcrypt.hash(password, 10)
  await item.save()

  await createAdminActivityLog({
    adminId: item._id,
    module: 'Admin Management',
    action: 'RESET_PASSWORD',
    description: `Password reset for ${item.email}`,
    performedBy: req.user?._id
  })

  return respond(res, 200, 'Password reset successfully')
})

export const assignCompaniesToAdmin = asyncHandler(async (req, res) => {
  const { companyIds = [] } = req.body
  const item = await CompanyAdmin.findById(req.params.id)
  if (!item) return respond(res, 404, 'Admin not found')

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
  const data = serializeAdmin(populated)
  return respond(res, 200, 'Companies assigned successfully', { data, item: data })
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

  return respond(res, 200, 'Tenant companies fetched successfully', { data: companies, items: companies })
})
