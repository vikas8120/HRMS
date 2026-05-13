import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import TenantCompany from '../models/TenantCompany.js'
import AdminActivityLog from '../models/AdminActivityLog.js'
import AuditLog from '../models/AuditLog.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'locked']
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const logAdminActivity = async ({ adminId, action, description, performedBy }) => {
  if (!adminId) return
  const adminRef = await User.findById(adminId).select('name email')
  await AdminActivityLog.create({
    admin: adminId,
    adminName: adminRef?.name || '',
    adminEmail: adminRef?.email || '',
    module: 'Admin Management',
    action,
    description,
    performedBy
  })
}

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'admin',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata,
    severity: 'info',
    createdAt: new Date().toISOString()
  })
}

const serializeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone || '',
  role: admin.role,
  status: admin.status || 'active',
  companyId: admin.companyId?._id || admin.companyId || null,
  companyName: admin.companyId?.companyName || '',
  companyCode: admin.companyId?.companyCode || '',
  companyStatus: admin.companyId?.status || '',
  lastLogin: admin.lastLogin || null,
  createdAt: admin.createdAt || null,
  updatedAt: admin.updatedAt || null
})

export const getCompaniesDropdown = asyncHandler(async (_req, res) => {
  const companies = await TenantCompany.find()
    .select('_id companyName companyCode status')
    .sort({ companyName: 1 })

  return res.status(200).json({
    success: true,
    message: 'Companies fetched successfully',
    data: companies.map((company) => ({
      _id: company._id,
      companyName: company.companyName,
      code: company.companyCode || '',
      status: company.status
    })),
    companies: companies.map((company) => ({
      _id: company._id,
      companyName: company.companyName,
      code: company.companyCode || '',
      status: company.status
    }))
  })
})

export const getAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all', company = 'all' } = req.query
  const query = { role: 'admin' }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ]
  }
  if (status && status !== 'all') query.status = status
  if (company && company !== 'all') query.companyId = company

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    User.find(query)
      .populate('companyId', 'companyName companyCode status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query)
  ])

  return res.status(200).json({
    success: true,
    message: 'Admins fetched successfully',
    data: items.map(serializeAdmin),
    items: items.map(serializeAdmin),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  })
})

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone = '', password, companyId, status = 'active' } = req.body || {}

  if (!name || !email || !password || !companyId) {
    return res.status(400).json({ success: false, message: 'name, email, password and companyId are required' })
  }
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' })

  const company = await TenantCompany.findOne({ _id: companyId, status: 'active' })
  if (!company) return res.status(404).json({ success: false, message: 'Selected company does not exist or is not active' })

  const emailLower = String(email).toLowerCase().trim()
  const exists = await User.findOne({ email: emailLower })
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' })

  const hashedPassword = await bcrypt.hash(String(password), 10)

  const item = await User.create({
    name: String(name).trim(),
    email: emailLower,
    phone: String(phone || '').trim(),
    password: hashedPassword,
    role: 'admin',
    companyId: company._id,
    status
  })

  await logAdminActivity({
    adminId: item._id,
    action: 'CREATE',
    description: `Admin ${item.email} created for company ${company.companyName}`,
    performedBy: req.user?._id
  })
  await writeAudit(req, 'CREATE_ADMIN', `Admin ${item.email} created for company ${company.companyName}`, { adminId: item._id, companyId: company._id })

  const populated = await User.findById(item._id).populate('companyId', 'companyName companyCode status')
  return res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: serializeAdmin(populated),
    item: serializeAdmin(populated)
  })
})

export const getAdminById = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, role: 'admin' }).populate('companyId', 'companyName companyCode status')
  if (!item) return res.status(404).json({ success: false, message: 'Admin not found' })
  const data = serializeAdmin(item)
  return respond(res, 200, 'Admin fetched successfully', { data, item: data })
})

export const updateAdmin = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, role: 'admin' })
  if (!item) return res.status(404).json({ success: false, message: 'Admin not found' })

  const { name, phone, companyId, status } = req.body || {}
  if (name !== undefined) item.name = String(name).trim()
  if (phone !== undefined) item.phone = String(phone || '').trim()
  if (status !== undefined) item.status = status
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }

  if (companyId !== undefined) {
    const company = await TenantCompany.findOne({ _id: companyId, status: 'active' })
    if (!company) return res.status(404).json({ success: false, message: 'Selected company does not exist or is not active' })
    item.companyId = company._id
  }

  await item.save()
  await logAdminActivity({
    adminId: item._id,
    action: 'UPDATE',
    description: `Admin ${item.email} updated`,
    performedBy: req.user?._id
  })
  const populated = await User.findById(item._id).populate('companyId', 'companyName companyCode status')
  const data = serializeAdmin(populated)
  return respond(res, 200, 'Admin updated successfully', { data, item: data })
})

export const deleteAdmin = asyncHandler(async (req, res) => {
  const item = await User.findOne({ _id: req.params.id, role: 'admin' })
  if (!item) return res.status(404).json({ success: false, message: 'Admin not found' })

  const result = await User.deleteOne({ _id: item._id, role: 'admin' })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Admin not found' })

  await logAdminActivity({
    adminId: item._id,
    action: 'DELETE',
    description: `Admin ${item.email} deleted`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ success: true, message: 'Admin deleted successfully' })
})

export const updateAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {}
  if (!status) return res.status(400).json({ success: false, message: 'status is required' })
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' })

  const item = await User.findOne({ _id: req.params.id, role: 'admin' })
  if (!item) return res.status(404).json({ success: false, message: 'Admin not found' })

  item.status = status
  await item.save()
  await logAdminActivity({
    adminId: item._id,
    action: 'STATUS_CHANGE',
    description: `Admin ${item.email} status changed to ${status}`,
    performedBy: req.user?._id
  })
  const populated = await User.findById(item._id).populate('companyId', 'companyName companyCode status')
  const data = serializeAdmin(populated)
  return respond(res, 200, 'Admin status updated successfully', { data, item: data })
})

export const resetAdminPassword = asyncHandler(async (req, res) => {
  const { password } = req.body || {}
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
  }

  const item = await User.findOne({ _id: req.params.id, role: 'admin' })
  if (!item) return res.status(404).json({ success: false, message: 'Admin not found' })

  item.password = await bcrypt.hash(String(password), 10)
  await item.save()

  await logAdminActivity({
    adminId: item._id,
    action: 'RESET_PASSWORD',
    description: `Password reset for ${item.email}`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ success: true, message: 'Password reset successfully' })
})
