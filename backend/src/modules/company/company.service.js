import mongoose from 'mongoose'
import { Company } from '../../models/company.model.js'
import { SubscriptionPlan } from '../../models/subscriptionPlan.model.js'
import { Subscription } from '../../models/subscription.model.js'
import { Invoice } from '../../models/invoice.model.js'
import { Payment } from '../../models/payment.model.js'
import { syncRevenueAnalyticsSafely } from '../revenue-analytics/revenueAnalytics.service.js'

const toPlainCompany = (company) => {
  if (!company) return null
  const item = typeof company.toObject === 'function' ? company.toObject() : company
  return {
    ...item,
    id: String(item._id),
    _id: String(item._id),
    branches: (item.branches || []).map((branch) => ({
      ...branch,
      id: String(branch._id),
      _id: String(branch._id)
    })),
    activityLogs: (item.activityLogs || []).map((log) => ({
      ...log,
      id: String(log._id),
      _id: String(log._id)
    }))
  }
}

const addActivityLog = async (companyId, { action, description, actorName = 'Super Admin' }) => {
  await Company.updateOne(
    { _id: companyId },
    {
      $push: {
        activityLogs: {
          action,
          description,
          actorName,
          dateTime: new Date()
        }
      }
    }
  )
}

const createBillingRecordsForCompany = async (company, actor = {}) => {
  const planName = String(company.plan || 'Starter').trim()
  const plan = await SubscriptionPlan.findOne({ name: planName, status: 'active' }).lean()
  if (!plan) return null

  const existingSubscription = await Subscription.findOne({ company: company._id }).lean()
  if (existingSubscription) return null

  const billingCycle = 'monthly'
  const amount = Number(plan.monthlyPrice || 0)
  const subscription = await Subscription.create({
    company: company._id,
    plan: plan._id,
    billingCycle,
    status: 'active',
    autoRenewal: true,
    startDate: new Date(),
    endDate: null
  })

  const invoiceNumber = `INV-${String(company.companyCode || company._id).toUpperCase()}-${Date.now()}`
  const invoice = await Invoice.create({
    company: company._id,
    subscription: subscription._id,
    invoiceNumber,
    amount,
    dueDate: new Date(),
    status: 'paid',
    couponCode: ''
  })

  await Payment.create({
    company: company._id,
    invoice: invoice._id,
    amount,
    method: 'card',
    status: 'completed',
    transactionRef: `TXN-${String(company.companyCode || company._id).toUpperCase()}-${Date.now()}`,
    refundedAt: null
  })

  await addActivityLog(company._id, {
    action: 'BILLING_CREATED',
    description: `Billing records created for ${plan.name} plan (${billingCycle}).`,
    actorName: actor.actorName || 'Super Admin'
  })

  return { subscription, invoice, amount, planName: plan.name }
}

const buildTenantDatabaseName = (companyCode = '') => {
  const normalized = String(companyCode || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  return normalized ? `tenant_${normalized}` : ''
}

const buildCompanyPayload = (body = {}) => ({
  companyName: String(body.companyName || '').trim(),
  companyCode: String(body.companyCode || '').trim().toUpperCase(),
  industry: String(body.industry || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  phone: String(body.phone || '').trim(),
  address: String(body.address || '').trim(),
  city: String(body.city || '').trim(),
  state: String(body.state || '').trim(),
  country: String(body.country || '').trim(),
  timezone: String(body.timezone || 'Asia/Kolkata').trim(),
  currency: String(body.currency || 'INR').trim(),
  gst: String(body.gst || '').trim().toUpperCase(),
  pan: String(body.pan || '').trim().toUpperCase(),
  plan: String(body.plan || 'Starter').trim(),
  employeeLimit: Number(body.employeeLimit || 0),
  storageLimit: Number(body.storageLimit || 0),
  status: String(body.status || 'active').trim().toLowerCase(),
  branches: Array.isArray(body.branches) ? body.branches : undefined,
  storageUsage: body.storageUsage,
  branding: body.branding,
  domainSetup: body.domainSetup
})

export const listCompanies = async ({ page = 1, limit = 10, search = '', status = 'all', plan = 'all' } = {}) => {
  const pageNumber = Math.max(1, Number(page) || 1)
  const pageSize = Math.max(1, Number(limit) || 10)
  const query = {}

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { companyCode: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  if (status && status !== 'all') query.status = status
  if (plan && plan !== 'all') query.plan = plan

  const [items, total] = await Promise.all([
    Company.find(query).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Company.countDocuments(query)
  ])

  return {
    items: items.map(toPlainCompany),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  }
}

export const getCompanyById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }
  const company = await Company.findById(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }
  return { item: toPlainCompany(company) }
}

export const createCompany = async (body, actor = {}) => {
  const payload = buildCompanyPayload(body)
  if (!payload.companyName || !payload.companyCode || !payload.industry || !payload.email || !payload.phone) {
    throw Object.assign(new Error('Missing required company fields'), { statusCode: 400 })
  }

  const existing = await Company.findOne({
    $or: [
      { companyCode: payload.companyCode },
      { email: payload.email }
    ]
  })
  if (existing) {
    throw Object.assign(new Error('Company code or email already exists'), { statusCode: 409 })
  }

  const company = await Company.create({
    ...payload,
    tenantDatabaseName: buildTenantDatabaseName(payload.companyCode),
    tenantStatus: 'pending',
    branches: [],
    storageUsage: {
      usedStorage: 0,
      documentsCount: 0,
      backupSize: 0
    },
    branding: {
      logoUrl: '',
      primaryColor: '#0f766e',
      secondaryColor: '#115e59',
      customDomain: '',
      loginPageBranding: ''
    },
    domainSetup: {
      customDomain: '',
      verified: false,
      sslStatus: 'pending'
    },
    createdBy: actor.userId || null,
    updatedBy: actor.userId || null
  })

  await addActivityLog(company._id, {
    action: 'COMPANY_CREATED',
    description: `Company ${company.companyName} was created.`,
    actorName: actor.actorName || 'Super Admin'
  })

  const billing = await createBillingRecordsForCompany(company, actor)
  await syncRevenueAnalyticsSafely()

  const fresh = await Company.findById(company._id)
  return {
    item: toPlainCompany(fresh),
    billing,
    message: 'Company created successfully'
  }
}

export const updateCompany = async (id, body, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const payload = buildCompanyPayload(body)
  delete payload.companyCode

  const company = await Company.findById(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  Object.assign(company, {
    ...payload,
    updatedBy: actor.userId || null
  })

  await company.save()
  await addActivityLog(company._id, {
    action: 'COMPANY_UPDATED',
    description: `Company ${company.companyName} was updated.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Company updated successfully' }
}

export const deleteCompany = async (id, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const company = await Company.findByIdAndDelete(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  return {
    message: 'Company deleted successfully',
    item: toPlainCompany(company),
    deletedBy: actor.actorName || 'Super Admin'
  }
}

export const updateCompanyStatus = async (id, status, reason = '', actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const company = await Company.findById(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  company.status = String(status || company.status).toLowerCase()
  company.updatedBy = actor.userId || null
  await company.save()

  await addActivityLog(company._id, {
    action: 'COMPANY_STATUS_UPDATED',
    description: reason ? `Status changed to ${company.status}. Reason: ${reason}` : `Status changed to ${company.status}.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Status updated' }
}

export const addBranch = async (id, body, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const company = await Company.findById(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  const branch = {
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toUpperCase(),
    address: String(body.address || '').trim(),
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    country: company.country || '',
    manager: String(body.manager || '').trim(),
    phone: String(body.phone || '').trim(),
    status: String(body.status || 'active').toLowerCase()
  }

  if (!branch.name) {
    throw Object.assign(new Error('Branch name is required'), { statusCode: 400 })
  }

  company.branches.push(branch)
  company.updatedBy = actor.userId || null
  await company.save()

  await addActivityLog(company._id, {
    action: 'BRANCH_ADDED',
    description: `Branch ${branch.name} was added.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Branch added' }
}

export const updateBranch = async (companyId, branchId, body, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(branchId)) {
    throw Object.assign(new Error('Invalid id'), { statusCode: 400 })
  }

  const company = await Company.findById(companyId)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  const branch = company.branches.id(branchId)
  if (!branch) {
    throw Object.assign(new Error('Branch not found'), { statusCode: 404 })
  }

  Object.assign(branch, {
    ...body,
    code: body.code ? String(body.code).toUpperCase() : branch.code,
    updatedAt: new Date()
  })

  company.updatedBy = actor.userId || null
  await company.save()

  await addActivityLog(company._id, {
    action: 'BRANCH_UPDATED',
    description: `Branch ${branch.name} was updated.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Branch updated' }
}

export const deleteBranch = async (companyId, branchId, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(branchId)) {
    throw Object.assign(new Error('Invalid id'), { statusCode: 400 })
  }

  const company = await Company.findById(companyId)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  const branch = company.branches.id(branchId)
  if (!branch) {
    throw Object.assign(new Error('Branch not found'), { statusCode: 404 })
  }

  branch.deleteOne()
  company.updatedBy = actor.userId || null
  await company.save()

  await addActivityLog(company._id, {
    action: 'BRANCH_DELETED',
    description: `Branch ${branch.name} was deleted.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Branch deleted' }
}

export const updateBranding = async (id, body, actor = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const company = await Company.findById(id)
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  company.branding = {
    ...company.branding,
    ...(body || {})
  }
  company.updatedBy = actor.userId || null
  await company.save()

  await addActivityLog(company._id, {
    action: 'BRANDING_UPDATED',
    description: `Branding updated for ${company.companyName}.`,
    actorName: actor.actorName || 'Super Admin'
  })
  await syncRevenueAnalyticsSafely()

  return { item: toPlainCompany(company), message: 'Branding updated' }
}

export const getCompanyActivityLogs = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Invalid company id'), { statusCode: 400 })
  }

  const company = await Company.findById(id).lean()
  if (!company) {
    throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  }

  return {
    items: (company.activityLogs || []).map((log) => ({
      _id: String(log._id),
      action: log.action,
      description: log.description,
      dateTime: log.dateTime
    }))
  }
}
