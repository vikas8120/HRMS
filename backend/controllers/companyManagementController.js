import crypto from 'crypto'
import TenantCompany from '../models/TenantCompany.js'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import Subscription from '../models/Subscription.js'
import GlobalUser from '../models/GlobalUser.js'
import AuditLog from '../models/AuditLog.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'company',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata,
    severity: 'info',
    createdAt: new Date().toISOString()
  })
}

const pushActivity = async (company, action, description, performedBy) => {
  company.activityLogs.push({ action, description, performedBy })
  await company.save()
}

const ensureSubdocIds = (entries = []) =>
  entries.map((entry) => ({ _id: entry._id || crypto.randomUUID().replace(/-/g, ''), ...entry }))

const findBranchIndex = (branches = [], branchId) => branches.findIndex((b) => String(b._id) === String(branchId))

const serializeCompany = (item) => ({
  id: item._id,
  companyName: item.companyName,
  companyCode: item.companyCode,
  industry: item.industry,
  email: item.email,
  phone: item.phone,
  address: item.address,
  city: item.city,
  state: item.state,
  country: item.country,
  timezone: item.timezone,
  currency: item.currency,
  gst: item.gst,
  pan: item.pan,
  plan: item.plan,
  employeeLimit: item.employeeLimit,
  employees: item.employees,
  storageLimit: item.storageLimit,
  status: item.status,
  branding: item.branding,
  domainSetup: item.domainSetup,
  storageUsage: item.storageUsage,
  branches: item.branches,
  configuration: item.configuration,
  suspensionReason: item.suspensionReason,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
})

export const getCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all', plan = 'all' } = req.query
  const query = {}

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { companyCode: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }
  if (status !== 'all') query.status = status
  if (plan !== 'all') query.plan = plan

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    TenantCompany.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    TenantCompany.countDocuments(query)
  ])

  const data = items.map(serializeCompany)
  return respond(res, 200, 'Companies fetched successfully', {
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

export const createCompany = asyncHandler(async (req, res) => {
  const body = req.body
  const required = ['companyName', 'companyCode', 'industry', 'email', 'phone', 'plan']
  for (const field of required) {
    if (!body[field]) return respond(res, 400, `${field} is required`)
  }
  if (!EMAIL_REGEX.test(body.email)) return respond(res, 400, 'Invalid email format')

  const exists = await TenantCompany.findOne({ $or: [{ companyCode: body.companyCode.trim() }, { email: body.email.toLowerCase().trim() }] })
  if (exists) return respond(res, 400, 'Company code or email already exists')

  const item = await TenantCompany.create({
    ...body,
    companyName: body.companyName.trim(),
    companyCode: body.companyCode.trim(),
    email: body.email.toLowerCase().trim()
  })

  await pushActivity(item, 'CREATE_COMPANY', `Company ${item.companyName} created`, req.user?._id)
  await writeAudit(req, 'CREATE_COMPANY', `Company ${item.companyName} created`, { companyId: item._id, companyCode: item.companyCode })
  const data = serializeCompany(item)
  return respond(res, 201, 'Company created successfully', { data, item: data })
})

export const getCompanyById = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')
  const data = serializeCompany(item)
  return respond(res, 200, 'Company fetched successfully', { data, item: data })
})

export const updateCompany = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  const updatable = ['companyName', 'industry', 'email', 'phone', 'address', 'city', 'state', 'country', 'timezone', 'currency', 'gst', 'pan', 'plan', 'employeeLimit', 'storageLimit', 'status']
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field]
  })

  if (req.body.email && !EMAIL_REGEX.test(req.body.email)) {
    return respond(res, 400, 'Invalid email format')
  }

  await item.save()
  await pushActivity(item, 'UPDATE_COMPANY', `Company ${item.companyName} updated`, req.user?._id)

  const data = serializeCompany(item)
  return respond(res, 200, 'Company updated successfully', { data, item: data })
})

export const deleteCompany = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  const [linkedUsersCount, linkedSubscriptionsCount, linkedGlobalUsersCount] = await Promise.all([
    User.countDocuments({ companyId: item._id }),
    Subscription.countDocuments({ company: item._id }),
    GlobalUser.countDocuments({ company: item._id })
  ])

  if (linkedUsersCount > 0 || linkedSubscriptionsCount > 0 || linkedGlobalUsersCount > 0) {
    return respond(res, 400, 'Company cannot be deleted because linked records exist', {
      details: {
        linkedUsers: linkedUsersCount,
        linkedSubscriptions: linkedSubscriptionsCount,
        linkedGlobalUsers: linkedGlobalUsersCount
      }
    })
  }

  await TenantCompany.deleteOne({ _id: item._id })
  return respond(res, 200, 'Company deleted successfully')
})

export const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body
  const valid = ['active', 'inactive', 'suspended', 'trial', 'expired']
  if (!valid.includes(status)) return respond(res, 400, 'Invalid status')

  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  item.status = status
  if (status === 'suspended') item.suspensionReason = reason
  if (status === 'active') item.suspensionReason = ''
  await item.save()

  await pushActivity(item, 'STATUS_CHANGE', `Status changed to ${status}${reason ? `: ${reason}` : ''}`, req.user?._id)
  const data = serializeCompany(item)
  return respond(res, 200, 'Company status updated successfully', { data, item: data })
})

export const addBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  const { name, code } = req.body
  if (!name || !code) return respond(res, 400, 'name and code are required')

  item.branches = ensureSubdocIds([...(item.branches || []), req.body])
  await item.save()
  await pushActivity(item, 'ADD_BRANCH', `Branch ${name} added`, req.user?._id)

  return respond(res, 201, 'Branch added successfully', { data: item.branches, items: item.branches, branches: item.branches })
})

export const updateBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  const branches = [...(item.branches || [])]
  const branchIndex = findBranchIndex(branches, req.params.branchId)
  if (branchIndex === -1) return respond(res, 404, 'Branch not found')

  branches[branchIndex] = { ...branches[branchIndex], ...req.body }
  item.branches = branches

  await item.save()
  await pushActivity(item, 'UPDATE_BRANCH', `Branch ${branches[branchIndex].name} updated`, req.user?._id)
  return respond(res, 200, 'Branch updated successfully', { data: item.branches, items: item.branches, branches: item.branches })
})

export const deleteBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  const branches = [...(item.branches || [])]
  const branchIndex = findBranchIndex(branches, req.params.branchId)
  if (branchIndex === -1) return respond(res, 404, 'Branch not found')

  const branchName = branches[branchIndex].name
  branches.splice(branchIndex, 1)
  item.branches = branches
  await item.save()
  await pushActivity(item, 'DELETE_BRANCH', `Branch ${branchName} deleted`, req.user?._id)

  return respond(res, 200, 'Branch deleted successfully', { data: item.branches, items: item.branches, branches: item.branches })
})

export const updateBranding = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  item.branding = { ...(item.branding || {}), ...req.body }
  await item.save()
  await pushActivity(item, 'UPDATE_BRANDING', 'Company branding updated', req.user?._id)

  const data = serializeCompany(item)
  return respond(res, 200, 'Company branding updated successfully', { data, item: data })
})

export const updateDomain = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return respond(res, 404, 'Company not found')

  item.domainSetup = { ...(item.domainSetup || {}), ...req.body }
  await item.save()
  await pushActivity(item, 'UPDATE_DOMAIN', `Domain updated to ${item.domainSetup.customDomain || '-'}`, req.user?._id)

  const data = serializeCompany(item)
  return respond(res, 200, 'Company domain updated successfully', { data, item: data })
})

export const getCompanyActivityLogs = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id).select('activityLogs companyName')
  if (!item) return respond(res, 404, 'Company not found')
  const data = item.activityLogs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
  return respond(res, 200, 'Company activity logs fetched successfully', { data, items: data, companyName: item.companyName })
})

export const listTenantCompanies = asyncHandler(async (_req, res) => {
  let companies = await TenantCompany.find().sort({ companyName: 1 })

  if (companies.length === 0) {
    companies = await TenantCompany.insertMany([
      { companyName: 'Acme Corp', companyCode: 'ACME', industry: 'Technology', email: 'contact@acme.com', phone: '9000000001', plan: 'Enterprise', status: 'active' },
      { companyName: 'Globex', companyCode: 'GLBX', industry: 'Finance', email: 'hello@globex.io', phone: '9000000002', plan: 'Growth', status: 'trial' },
      { companyName: 'Innotech', companyCode: 'INNO', industry: 'Healthcare', email: 'team@innotech.ai', phone: '9000000003', plan: 'Starter', status: 'active' }
    ])
  }

  const data = companies.map((company) => ({ _id: company._id, name: company.companyName }))
  return respond(res, 200, 'Tenant companies fetched successfully', { data, items: data })
})
