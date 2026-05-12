import crypto from 'crypto'
import TenantCompany from '../models/TenantCompany.js'
import asyncHandler from '../utils/asyncHandler.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  return res.status(200).json({
    items: items.map(serializeCompany),
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
    if (!body[field]) return res.status(400).json({ message: `${field} is required` })
  }
  if (!EMAIL_REGEX.test(body.email)) return res.status(400).json({ message: 'Invalid email format' })

  const exists = await TenantCompany.findOne({ $or: [{ companyCode: body.companyCode.trim() }, { email: body.email.toLowerCase().trim() }] })
  if (exists) return res.status(400).json({ message: 'Company code or email already exists' })

  const item = await TenantCompany.create({
    ...body,
    companyName: body.companyName.trim(),
    companyCode: body.companyCode.trim(),
    email: body.email.toLowerCase().trim()
  })

  await pushActivity(item, 'CREATE_COMPANY', `Company ${item.companyName} created`, req.user?._id)
  return res.status(201).json({ item: serializeCompany(item) })
})

export const getCompanyById = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })
  return res.status(200).json({ item: serializeCompany(item) })
})

export const updateCompany = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  const updatable = ['companyName', 'industry', 'email', 'phone', 'address', 'city', 'state', 'country', 'timezone', 'currency', 'gst', 'pan', 'plan', 'employeeLimit', 'storageLimit', 'status']
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field]
  })

  if (req.body.email && !EMAIL_REGEX.test(req.body.email)) {
    return res.status(400).json({ message: 'Invalid email format' })
  }

  await item.save()
  await pushActivity(item, 'UPDATE_COMPANY', `Company ${item.companyName} updated`, req.user?._id)

  return res.status(200).json({ item: serializeCompany(item) })
})

export const deleteCompany = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  await TenantCompany.deleteOne({ _id: item._id })
  return res.status(200).json({ message: 'Company deleted successfully' })
})

export const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body
  const valid = ['active', 'inactive', 'suspended', 'trial', 'expired']
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' })

  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  item.status = status
  if (status === 'suspended') item.suspensionReason = reason
  if (status === 'active') item.suspensionReason = ''
  await item.save()

  await pushActivity(item, 'STATUS_CHANGE', `Status changed to ${status}${reason ? `: ${reason}` : ''}`, req.user?._id)
  return res.status(200).json({ item: serializeCompany(item) })
})

export const addBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  const { name, code } = req.body
  if (!name || !code) return res.status(400).json({ message: 'name and code are required' })

  item.branches = ensureSubdocIds([...(item.branches || []), req.body])
  await item.save()
  await pushActivity(item, 'ADD_BRANCH', `Branch ${name} added`, req.user?._id)

  return res.status(201).json({ branches: item.branches })
})

export const updateBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  const branches = [...(item.branches || [])]
  const branchIndex = findBranchIndex(branches, req.params.branchId)
  if (branchIndex === -1) return res.status(404).json({ message: 'Branch not found' })

  branches[branchIndex] = { ...branches[branchIndex], ...req.body }
  item.branches = branches

  await item.save()
  await pushActivity(item, 'UPDATE_BRANCH', `Branch ${branches[branchIndex].name} updated`, req.user?._id)
  return res.status(200).json({ branches: item.branches })
})

export const deleteBranch = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  const branches = [...(item.branches || [])]
  const branchIndex = findBranchIndex(branches, req.params.branchId)
  if (branchIndex === -1) return res.status(404).json({ message: 'Branch not found' })

  const branchName = branches[branchIndex].name
  branches.splice(branchIndex, 1)
  item.branches = branches
  await item.save()
  await pushActivity(item, 'DELETE_BRANCH', `Branch ${branchName} deleted`, req.user?._id)

  return res.status(200).json({ branches: item.branches })
})

export const updateBranding = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  item.branding = { ...(item.branding || {}), ...req.body }
  await item.save()
  await pushActivity(item, 'UPDATE_BRANDING', 'Company branding updated', req.user?._id)

  return res.status(200).json({ item: serializeCompany(item) })
})

export const updateDomain = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Company not found' })

  item.domainSetup = { ...(item.domainSetup || {}), ...req.body }
  await item.save()
  await pushActivity(item, 'UPDATE_DOMAIN', `Domain updated to ${item.domainSetup.customDomain || '-'}`, req.user?._id)

  return res.status(200).json({ item: serializeCompany(item) })
})

export const getCompanyActivityLogs = asyncHandler(async (req, res) => {
  const item = await TenantCompany.findById(req.params.id).select('activityLogs companyName')
  if (!item) return res.status(404).json({ message: 'Company not found' })

  return res.status(200).json({ companyName: item.companyName, items: item.activityLogs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)) })
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

  return res.status(200).json({ items: companies.map((company) => ({ _id: company._id, name: company.companyName })) })
})
