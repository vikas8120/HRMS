import mongoose from 'mongoose'
import { Company } from '../../models/company.model.js'
import { CompanyCustomPlan } from '../../models/companyCustomPlan.model.js'
import { SubscriptionPlan } from '../../models/subscriptionPlan.model.js'
import { Subscription } from '../../models/subscription.model.js'
import { Invoice } from '../../models/invoice.model.js'
import { Payment } from '../../models/payment.model.js'
import { Coupon } from '../../models/coupon.model.js'
import { Addon } from '../../models/addon.model.js'
import { syncRevenueAnalyticsSafely } from '../revenue-analytics/revenueAnalytics.service.js'

const DEFAULT_PLANS = [
  {
    type: 'standard',
    name: 'Starter',
    monthlyPrice: 799,
    yearlyPrice: 7999,
    userLimit: 50,
    storageLimit: 5,
    features: ['Basic HR tools', 'Employee profiles', 'Attendance'],
    status: 'active'
  },
  {
    type: 'growth',
    name: 'Growth',
    monthlyPrice: 1499,
    yearlyPrice: 14999,
    userLimit: 150,
    storageLimit: 25,
    features: ['Advanced HR tools', 'Reports', 'Workflow automation', 'Priority support'],
    status: 'active'
  },
  {
    type: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    userLimit: 500,
    storageLimit: 100,
    features: ['Unlimited departments', 'Custom reports', 'SLA support', 'Dedicated onboarding'],
    status: 'active'
  },
  {
    type: 'custom',
    name: 'Custom',
    monthlyPrice: 0,
    yearlyPrice: 0,
    userLimit: 0,
    storageLimit: 0,
    features: ['Custom pricing', 'Custom limits', 'Custom contract'],
    status: 'active'
  }
]

const DEFAULT_COUPONS = [
  { code: 'WELCOME10', discountType: 'percent', discountValue: 10, active: true },
  { code: 'FLAT500', discountType: 'flat', discountValue: 500, active: true }
]

const DEFAULT_ADDONS = [
  { name: 'Advanced Analytics', description: 'Extra analytics and dashboards', priceMonthly: 199, priceYearly: 1999, active: true },
  { name: 'White Label', description: 'Remove branding and use custom domain', priceMonthly: 499, priceYearly: 4999, active: true }
]

const toId = (value) => String(value || '')
const normalizeId = (value) => {
  const text = String(value || '').trim()
  return mongoose.Types.ObjectId.isValid(text) ? new mongoose.Types.ObjectId(text) : null
}
const clone = (value) => JSON.parse(JSON.stringify(value))
const toPlain = (doc) => {
  if (!doc) return null
  const item = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return { ...item, id: toId(item._id), _id: toId(item._id) }
}
const toPopulatedSubscription = (doc) => {
  const item = toPlain(doc)
  if (!item) return null
  return {
    ...item,
    company: item.company && typeof item.company === 'object' ? { ...item.company, id: toId(item.company._id), _id: toId(item.company._id) } : item.company,
    plan: item.plan && typeof item.plan === 'object' ? { ...item.plan, id: toId(item.plan._id), _id: toId(item.plan._id) } : item.plan,
    customPlan: item.customPlan && typeof item.customPlan === 'object' ? { ...item.customPlan, id: toId(item.customPlan._id), _id: toId(item.customPlan._id) } : item.customPlan,
    planLabel:
      item.customPlan && typeof item.customPlan === 'object'
        ? item.customPlan.name
        : item.plan && typeof item.plan === 'object'
          ? item.plan.name
          : ''
  }
}
const toPopulatedInvoice = (doc) => {
  const item = toPlain(doc)
  if (!item) return null
  return {
    ...item,
    company: item.company && typeof item.company === 'object' ? { ...item.company, id: toId(item.company._id), _id: toId(item.company._id) } : item.company,
    subscription: item.subscription && typeof item.subscription === 'object' ? toPopulatedSubscription(item.subscription) : item.subscription
  }
}

const ensureSeedPlans = async () => {
  const count = await SubscriptionPlan.countDocuments()
  if (count > 0) return
  await SubscriptionPlan.insertMany(clone(DEFAULT_PLANS))
}

const ensureSeedCoupons = async () => {
  const count = await Coupon.countDocuments()
  if (count > 0) return
  await Coupon.insertMany(clone(DEFAULT_COUPONS))
}

const ensureSeedAddons = async () => {
  const count = await Addon.countDocuments()
  if (count > 0) return
  await Addon.insertMany(clone(DEFAULT_ADDONS))
}

const listCollection = async (Model, query = {}, options = {}, populate = []) => {
  const pageNumber = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(1, Number(options.limit) || 10)
  const [items, total] = await Promise.all([
    Model.find(query).populate(populate).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Model.countDocuments(query)
  ])
  return {
    items,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  }
}

const buildPlanPayload = (body = {}) => ({
  type: String(body.type || 'standard').trim().toLowerCase(),
  name: String(body.name || '').trim(),
  monthlyPrice: Number(body.monthlyPrice ?? body.price ?? 0),
  yearlyPrice: Number(body.yearlyPrice ?? 0),
  userLimit: Number(body.userLimit ?? body.employeeLimit ?? 0),
  storageLimit: Number(body.storageLimit ?? 0),
  features: (Array.isArray(body.features)
    ? body.features.map((item) => String(item || '').trim()).filter(Boolean)
    : String(body.features || '').split(',').map((item) => item.trim()).filter(Boolean)
  ),
  status: String(body.status || 'active').trim().toLowerCase()
})

const buildSubscriptionPayload = (body = {}, { partial = false } = {}) => {
  const payload = {}

  if (!partial || body.company !== undefined || body.companyId !== undefined) {
    payload.company = normalizeId(body.company || body.companyId)
  }

  const planId = normalizeId(body.plan || body.planId)
  const customPlanId = normalizeId(body.customPlan || body.customPlanId)
  if (!partial || body.plan !== undefined || body.planId !== undefined || body.customPlan !== undefined || body.customPlanId !== undefined) {
    if (planId && customPlanId) {
      throw Object.assign(new Error('Use either a plan or a custom plan, not both'), { statusCode: 400 })
    }
    payload.plan = customPlanId ? null : planId
    payload.customPlan = customPlanId
    payload.planSource = customPlanId ? 'custom' : 'plan'
  }

  if (!partial || body.billingCycle !== undefined) {
    payload.billingCycle = String(body.billingCycle || 'monthly').trim().toLowerCase()
  }

  if (!partial || body.status !== undefined) {
    payload.status = String(body.status || 'active').trim().toLowerCase()
  }

  if (!partial || body.autoRenewal !== undefined) {
    payload.autoRenewal = Boolean(body.autoRenewal)
  }

  if (!partial || body.startDate !== undefined) {
    payload.startDate = body.startDate ? new Date(body.startDate) : Date.now()
  }

  if (!partial || body.endDate !== undefined) {
    payload.endDate = body.endDate ? new Date(body.endDate) : null
  }

  return payload
}

const buildInvoicePayload = (body = {}) => ({
  company: normalizeId(body.company || body.companyId),
  subscription: normalizeId(body.subscription || body.subscriptionId),
  invoiceNumber: String(body.invoiceNumber || '').trim(),
  amount: Number(body.amount || 0),
  dueDate: body.dueDate ? new Date(body.dueDate) : null,
  status: String(body.status || 'pending').trim().toLowerCase(),
  couponCode: String(body.couponCode || '').trim().toUpperCase()
})

const buildPaymentPayload = (body = {}) => ({
  company: normalizeId(body.company || body.companyId),
  invoice: normalizeId(body.invoice || body.invoiceId),
  amount: Number(body.amount || 0),
  method: String(body.method || 'card').trim().toLowerCase(),
  status: String(body.status || 'completed').trim().toLowerCase(),
  transactionRef: String(body.transactionRef || '').trim(),
  refundedAt: body.refundedAt ? new Date(body.refundedAt) : null
})

const buildCouponPayload = (body = {}) => ({
  code: String(body.code || '').trim().toUpperCase(),
  discountType: String(body.discountType || 'percent').trim().toLowerCase(),
  discountValue: Number(body.discountValue || 0),
  active: Boolean(body.active),
  expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
})

const buildAddonPayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  description: String(body.description || '').trim(),
  priceMonthly: Number(body.priceMonthly || 0),
  priceYearly: Number(body.priceYearly || 0),
  active: Boolean(body.active)
})

export const listPlans = async (query = {}) => {
  await ensureSeedPlans()
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const search = String(query.search || '').trim()
  const status = String(query.status || 'all').trim().toLowerCase()
  const type = String(query.type || 'all').trim().toLowerCase()
  if (search) {
    dbQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { features: { $elemMatch: { $regex: search, $options: 'i' } } }
    ]
  }
  if (status !== 'all') dbQuery.status = status
  if (type && type !== 'all') dbQuery.type = type
  const [items, total] = await Promise.all([
    SubscriptionPlan.find(dbQuery).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    SubscriptionPlan.countDocuments(dbQuery)
  ])
  return {
    items: items.map(toPlain),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

const buildCompanyCustomPlanPayload = (body = {}) => ({
  company: normalizeId(body.company || body.companyId),
  name: String(body.name || '').trim(),
  monthlyPrice: Number(body.monthlyPrice ?? body.price ?? 0),
  yearlyPrice: Number(body.yearlyPrice ?? 0),
  userLimit: Number(body.userLimit ?? body.employeeLimit ?? 0),
  storageLimit: Number(body.storageLimit ?? 0),
  features: (Array.isArray(body.features)
    ? body.features.map((item) => String(item || '').trim()).filter(Boolean)
    : String(body.features || '').split(',').map((item) => item.trim()).filter(Boolean)
  ),
  status: String(body.status || 'active').trim().toLowerCase(),
  notes: String(body.notes || '').trim()
})

export const listCompanyCustomPlans = async (query = {}) => {
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const search = String(query.search || '').trim()
  const status = String(query.status || 'all').trim().toLowerCase()
  const companyId = normalizeId(query.company || query.companyId)
  if (companyId) dbQuery.company = companyId
  if (status !== 'all') dbQuery.status = status
  if (search) {
    dbQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { features: { $regex: search, $options: 'i' } }
    ]
  }
  const [items, total] = await Promise.all([
    CompanyCustomPlan.find(dbQuery).populate('company').sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    CompanyCustomPlan.countDocuments(dbQuery)
  ])
  return {
    items: items.map((item) => {
      const plain = toPlain(item)
      return {
        ...plain,
        company: plain.company && typeof plain.company === 'object' ? { ...plain.company, id: toId(plain.company._id), _id: toId(plain.company._id) } : plain.company
      }
    }),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createCompanyCustomPlan = async (body = {}) => {
  const payload = buildCompanyCustomPlanPayload(body)
  if (!payload.company) throw Object.assign(new Error('Company is required'), { statusCode: 400 })
  if (!payload.name) throw Object.assign(new Error('Custom plan name is required'), { statusCode: 400 })
  const company = await Company.findById(payload.company)
  if (!company) throw Object.assign(new Error('Company not found'), { statusCode: 404 })
  const existing = await CompanyCustomPlan.findOne({ company: payload.company, name: payload.name })
  if (existing) throw Object.assign(new Error('Custom plan already exists for this company'), { statusCode: 409 })
  const plan = await CompanyCustomPlan.create(payload)
  const fresh = await CompanyCustomPlan.findById(plan._id).populate('company')
  await syncRevenueAnalyticsSafely()
  return {
    item: {
      ...toPlain(fresh),
      company: fresh.company ? { ...toPlain(fresh.company), id: toId(fresh.company._id), _id: toId(fresh.company._id) } : fresh.company
    },
    message: 'Custom plan created successfully'
  }
}

export const updateCompanyCustomPlan = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid custom plan id'), { statusCode: 400 })
  const plan = await CompanyCustomPlan.findById(id)
  if (!plan) throw Object.assign(new Error('Custom plan not found'), { statusCode: 404 })
  const payload = buildCompanyCustomPlanPayload(body)
  if (!payload.company) payload.company = plan.company
  Object.assign(plan, payload)
  await plan.save()
  const fresh = await CompanyCustomPlan.findById(plan._id).populate('company')
  await syncRevenueAnalyticsSafely()
  return {
    item: {
      ...toPlain(fresh),
      company: fresh.company ? { ...toPlain(fresh.company), id: toId(fresh.company._id), _id: toId(fresh.company._id) } : fresh.company
    },
    message: 'Custom plan updated successfully'
  }
}

export const deleteCompanyCustomPlan = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid custom plan id'), { statusCode: 400 })
  const plan = await CompanyCustomPlan.findByIdAndDelete(id)
  if (!plan) throw Object.assign(new Error('Custom plan not found'), { statusCode: 404 })
  await syncRevenueAnalyticsSafely()
  return { item: toPlain(plan), message: 'Custom plan deleted successfully' }
}

export const getPlanById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid plan id'), { statusCode: 400 })
  const plan = await SubscriptionPlan.findById(id)
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })
  return { item: toPlain(plan) }
}

export const createPlan = async (body = {}) => {
  await ensureSeedPlans()
  const payload = buildPlanPayload(body)
  if (!payload.name) throw Object.assign(new Error('Plan name is required'), { statusCode: 400 })
  const existing = await SubscriptionPlan.findOne({ name: payload.name })
  if (existing) throw Object.assign(new Error('Plan already exists'), { statusCode: 409 })
  const plan = await SubscriptionPlan.create(payload)
  await syncRevenueAnalyticsSafely()
  return { item: toPlain(plan), message: 'Plan created successfully' }
}

export const updatePlan = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid plan id'), { statusCode: 400 })
  const plan = await SubscriptionPlan.findById(id)
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })
  const payload = buildPlanPayload(body)
  Object.assign(plan, payload)
  await plan.save()
  await syncRevenueAnalyticsSafely()
  return { item: toPlain(plan), message: 'Plan updated successfully' }
}

export const deletePlan = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid plan id'), { statusCode: 400 })
  const plan = await SubscriptionPlan.findByIdAndDelete(id)
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })
  await syncRevenueAnalyticsSafely()
  return { item: toPlain(plan), message: 'Plan deleted successfully' }
}

export const listSubscriptions = async (query = {}) => {
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const status = String(query.status || 'all').trim().toLowerCase()
  if (status !== 'all') dbQuery.status = status
  const [items, total] = await Promise.all([
    Subscription.find(dbQuery).populate('company').populate('plan').populate('customPlan').sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Subscription.countDocuments(dbQuery)
  ])
  return {
    items: items.map(toPopulatedSubscription),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createSubscription = async (body = {}) => {
  const payload = buildSubscriptionPayload(body)
  if (!payload.company) throw Object.assign(new Error('Company is required'), { statusCode: 400 })
  if (!payload.plan && !payload.customPlan) throw Object.assign(new Error('Plan or custom plan is required'), { statusCode: 400 })
  const subscription = await Subscription.create(payload)
  const fresh = await Subscription.findById(subscription._id).populate('company').populate('plan').populate('customPlan')
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedSubscription(fresh), message: 'Subscription assigned successfully' }
}

export const updateSubscription = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid subscription id'), { statusCode: 400 })
  const subscription = await Subscription.findById(id)
  if (!subscription) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 })
  Object.assign(subscription, buildSubscriptionPayload(body, { partial: true }))
  await subscription.save()
  const fresh = await Subscription.findById(subscription._id).populate('company').populate('plan').populate('customPlan')
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedSubscription(fresh), message: 'Subscription updated successfully' }
}

export const deleteSubscription = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid subscription id'), { statusCode: 400 })
  const subscription = await Subscription.findByIdAndDelete(id)
  if (!subscription) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 })
  await syncRevenueAnalyticsSafely()
  return { message: 'Subscription deleted successfully', item: toPopulatedSubscription(subscription) }
}

export const upgradeDowngrade = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid subscription id'), { statusCode: 400 })
  const subscription = await Subscription.findById(id)
  if (!subscription) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 })
  if (body.planId) {
    subscription.plan = body.planId
    subscription.customPlan = null
    subscription.planSource = 'plan'
  }
  if (body.customPlanId) {
    subscription.customPlan = body.customPlanId
    subscription.plan = null
    subscription.planSource = 'custom'
  }
  if (body.billingCycle) subscription.billingCycle = String(body.billingCycle).trim().toLowerCase()
  await subscription.save()
  const fresh = await Subscription.findById(subscription._id).populate('company').populate('plan').populate('customPlan')
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedSubscription(fresh), message: 'Subscription updated successfully' }
}

export const setAutoRenewal = async (id, autoRenewal = false) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid subscription id'), { statusCode: 400 })
  const subscription = await Subscription.findById(id)
  if (!subscription) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 })
  subscription.autoRenewal = Boolean(autoRenewal)
  await subscription.save()
  const fresh = await Subscription.findById(subscription._id).populate('company').populate('plan').populate('customPlan')
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedSubscription(fresh), message: 'Auto renewal updated successfully' }
}

export const listInvoices = async (query = {}) => {
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const status = String(query.status || 'all').trim().toLowerCase()
  if (status !== 'all') dbQuery.status = status
  const [items, total] = await Promise.all([
    Invoice.find(dbQuery).populate('company').populate({ path: 'subscription', populate: ['company', 'plan', 'customPlan'] }).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Invoice.countDocuments(dbQuery)
  ])
  return {
    items: items.map(toPopulatedInvoice),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createInvoice = async (body = {}) => {
  const payload = buildInvoicePayload(body)
  if (!payload.company || !payload.amount || !payload.dueDate) throw Object.assign(new Error('Company, amount, and due date are required'), { statusCode: 400 })
  if (!payload.invoiceNumber) payload.invoiceNumber = `INV-${Date.now()}`
  const invoice = await Invoice.create(payload)
  const fresh = await Invoice.findById(invoice._id).populate('company').populate({ path: 'subscription', populate: ['company', 'plan', 'customPlan'] })
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedInvoice(fresh), message: 'Invoice created successfully' }
}

export const generateInvoice = async (body = {}) => createInvoice({
  ...body,
  invoiceNumber: body.invoiceNumber || `AUTO-${Date.now()}`
})

export const updateInvoice = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid invoice id'), { statusCode: 400 })
  const invoice = await Invoice.findById(id)
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 })
  Object.assign(invoice, buildInvoicePayload(body))
  if (!invoice.invoiceNumber) invoice.invoiceNumber = `INV-${Date.now()}`
  await invoice.save()
  const fresh = await Invoice.findById(invoice._id).populate('company').populate({ path: 'subscription', populate: ['company', 'plan', 'customPlan'] })
  await syncRevenueAnalyticsSafely()
  return { item: toPopulatedInvoice(fresh), message: 'Invoice updated successfully' }
}

export const deleteInvoice = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid invoice id'), { statusCode: 400 })
  const invoice = await Invoice.findByIdAndDelete(id)
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 })
  await syncRevenueAnalyticsSafely()
  return { message: 'Invoice deleted successfully', item: toPopulatedInvoice(invoice) }
}

export const listPayments = async (query = {}) => {
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const status = String(query.status || 'all').trim().toLowerCase()
  if (status !== 'all') dbQuery.status = status
  const [items, total] = await Promise.all([
    Payment.find(dbQuery).populate('company').populate('invoice').sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Payment.countDocuments(dbQuery)
  ])
  return {
    items: items.map((item) => {
      const plain = toPlain(item)
      return {
        ...plain,
        company: plain.company && typeof plain.company === 'object' ? { ...plain.company, id: toId(plain.company._id), _id: toId(plain.company._id) } : plain.company,
        invoice: plain.invoice && typeof plain.invoice === 'object' ? { ...plain.invoice, id: toId(plain.invoice._id), _id: toId(plain.invoice._id) } : plain.invoice
      }
    }),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createPayment = async (body = {}) => {
  const payload = buildPaymentPayload(body)
  if (!payload.company || Number.isNaN(payload.amount)) throw Object.assign(new Error('Company and amount are required'), { statusCode: 400 })
  const payment = await Payment.create(payload)
  const fresh = await Payment.findById(payment._id).populate('company').populate('invoice')
  const plain = toPlain(fresh)
  await syncRevenueAnalyticsSafely()
  return {
    item: {
      ...plain,
      company: plain.company && typeof plain.company === 'object' ? { ...plain.company, id: toId(plain.company._id), _id: toId(plain.company._id) } : plain.company,
      invoice: plain.invoice && typeof plain.invoice === 'object' ? { ...plain.invoice, id: toId(plain.invoice._id), _id: toId(plain.invoice._id) } : plain.invoice
    },
    message: 'Payment recorded successfully'
  }
}

export const updatePayment = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid payment id'), { statusCode: 400 })
  const payment = await Payment.findById(id)
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 })
  Object.assign(payment, buildPaymentPayload(body))
  await payment.save()
  const fresh = await Payment.findById(payment._id).populate('company').populate('invoice')
  const plain = toPlain(fresh)
  await syncRevenueAnalyticsSafely()
  return {
    item: {
      ...plain,
      company: plain.company && typeof plain.company === 'object' ? { ...plain.company, id: toId(plain.company._id), _id: toId(plain.company._id) } : plain.company,
      invoice: plain.invoice && typeof plain.invoice === 'object' ? { ...plain.invoice, id: toId(plain.invoice._id), _id: toId(plain.invoice._id) } : plain.invoice
    },
    message: 'Payment updated successfully'
  }
}

export const deletePayment = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid payment id'), { statusCode: 400 })
  const payment = await Payment.findByIdAndDelete(id)
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 })
  await syncRevenueAnalyticsSafely()
  return { message: 'Payment deleted successfully', item: toPlain(payment) }
}

export const refundPayment = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid payment id'), { statusCode: 400 })
  const payment = await Payment.findById(id)
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 })
  payment.status = 'refunded'
  payment.refundedAt = new Date()
  await payment.save()
  const fresh = await Payment.findById(payment._id).populate('company').populate('invoice')
  const plain = toPlain(fresh)
  await syncRevenueAnalyticsSafely()
  return {
    item: {
      ...plain,
      company: plain.company && typeof plain.company === 'object' ? { ...plain.company, id: toId(plain.company._id), _id: toId(plain.company._id) } : plain.company,
      invoice: plain.invoice && typeof plain.invoice === 'object' ? { ...plain.invoice, id: toId(plain.invoice._id), _id: toId(plain.invoice._id) } : plain.invoice
    },
    message: 'Payment refunded successfully'
  }
}

export const listCoupons = async (query = {}) => {
  await ensureSeedCoupons()
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const search = String(query.search || '').trim()
  if (search) dbQuery.code = { $regex: search, $options: 'i' }
  const [items, total] = await Promise.all([
    Coupon.find(dbQuery).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Coupon.countDocuments(dbQuery)
  ])
  return {
    items: items.map(toPlain),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createCoupon = async (body = {}) => {
  await ensureSeedCoupons()
  const payload = buildCouponPayload(body)
  if (!payload.code) throw Object.assign(new Error('Coupon code is required'), { statusCode: 400 })
  const coupon = await Coupon.create(payload)
  return { item: toPlain(coupon), message: 'Coupon created successfully' }
}

export const updateCoupon = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid coupon id'), { statusCode: 400 })
  const coupon = await Coupon.findById(id)
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 })
  Object.assign(coupon, buildCouponPayload(body))
  await coupon.save()
  return { item: toPlain(coupon), message: 'Coupon updated successfully' }
}

export const deleteCoupon = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid coupon id'), { statusCode: 400 })
  const coupon = await Coupon.findByIdAndDelete(id)
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 })
  return { item: toPlain(coupon), message: 'Coupon deleted successfully' }
}

export const listAddons = async (query = {}) => {
  await ensureSeedAddons()
  const pageNumber = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.max(1, Number(query.limit) || 10)
  const dbQuery = {}
  const [items, total] = await Promise.all([
    Addon.find(dbQuery).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Addon.countDocuments(dbQuery)
  ])
  return {
    items: items.map(toPlain),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }
}

export const createAddon = async (body = {}) => {
  await ensureSeedAddons()
  const payload = buildAddonPayload(body)
  if (!payload.name) throw Object.assign(new Error('Add-on name is required'), { statusCode: 400 })
  const addon = await Addon.create(payload)
  return { item: toPlain(addon), message: 'Add-on created successfully' }
}

export const updateAddon = async (id, body = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid add-on id'), { statusCode: 400 })
  const addon = await Addon.findById(id)
  if (!addon) throw Object.assign(new Error('Add-on not found'), { statusCode: 404 })
  Object.assign(addon, buildAddonPayload(body))
  await addon.save()
  return { item: toPlain(addon), message: 'Add-on updated successfully' }
}

export const deleteAddon = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid add-on id'), { statusCode: 400 })
  const addon = await Addon.findByIdAndDelete(id)
  if (!addon) throw Object.assign(new Error('Add-on not found'), { statusCode: 404 })
  return { item: toPlain(addon), message: 'Add-on deleted successfully' }
}
