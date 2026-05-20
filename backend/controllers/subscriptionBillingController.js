import asyncHandler from '../utils/asyncHandler.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Subscription from '../models/Subscription.js'
import Invoice from '../models/Invoice.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import Coupon from '../models/Coupon.js'
import AddonService from '../models/AddonService.js'
import TenantCompany from '../models/TenantCompany.js'
import AuditLog from '../models/AuditLog.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const writeAudit = async (req, module, action, description, metadata = {}) => {
  await AuditLog.create({
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module,
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata,
    severity: 'info',
    createdAt: new Date().toISOString()
  })
}

const buildCrud = (Model, populate = '') => ({
  list: asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 200)
    const search = String(req.query.search || '')
    const status = String(req.query.status || 'all')
    const type = String(req.query.type || 'all')
    const skip = (page - 1) * limit
    const query = {}
    if (status && status !== 'all') query.status = status
    if (type && type !== 'all') query.type = type
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { transactionRef: { $regex: search, $options: 'i' } },
        { method: { $regex: search, $options: 'i' } }
      ]
    }

    const [items, total] = await Promise.all([
      Model.find(query).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(query)
    ])

    respond(res, 200, 'Records fetched successfully', { data: items, items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  }),
  create: asyncHandler(async (req, res) => {
    const item = await Model.create(req.body)
    await writeAudit(req, 'billing', `CREATE_${Model.name || 'RECORD'}`, `${Model.name || 'Record'} created`, { recordId: item._id })
    respond(res, 201, 'Record created successfully', { data: item, item })
  }),
  getById: asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id).populate(populate)
    if (!item) return respond(res, 404, 'Record not found')
    respond(res, 200, 'Record fetched successfully', { data: item, item })
  }),
  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate)
    if (!item) return respond(res, 404, 'Record not found')
    respond(res, 200, 'Record updated successfully', { data: item, item })
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id)
    if (!item) return respond(res, 404, 'Record not found')
    await Model.deleteOne({ _id: item._id })
    respond(res, 200, 'Deleted successfully')
  })
})

export const planCtrl = buildCrud(SubscriptionPlan)
export const subscriptionCtrl = buildCrud(Subscription, 'company plan')
export const invoiceCtrl = buildCrud(Invoice, 'company subscription')
export const paymentCtrl = buildCrud(PaymentTransaction, 'company invoice')
export const couponCtrl = buildCrud(Coupon)
export const addonCtrl = buildCrud(AddonService)

export const generateInvoice = asyncHandler(async (req, res) => {
  const { companyId, subscriptionId, amount, dueDate } = req.body
  if (!companyId || !amount || !dueDate) return respond(res, 400, 'companyId, amount and dueDate are required')

  const company = await TenantCompany.findById(companyId)
  if (!company) return respond(res, 404, 'Company not found')

  const invoiceCount = await Invoice.countDocuments()
  const invoice = await Invoice.create({
    company: companyId,
    subscription: subscriptionId || undefined,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount,
    dueDate,
    status: 'pending'
  })

  respond(res, 201, 'Invoice generated successfully', { data: invoice, item: invoice })
})

export const upgradeDowngradeSubscription = asyncHandler(async (req, res) => {
  const { planId, billingCycle, autoRenewal } = req.body
  const subscription = await Subscription.findById(req.params.id)
  if (!subscription) return respond(res, 404, 'Subscription not found')

  if (planId) subscription.plan = planId
  if (billingCycle) subscription.billingCycle = billingCycle
  if (autoRenewal !== undefined) subscription.autoRenewal = Boolean(autoRenewal)

  await subscription.save()
  respond(res, 200, 'Subscription updated successfully', { data: subscription, item: subscription })
})

export const toggleAutoRenewal = asyncHandler(async (req, res) => {
  const { autoRenewal } = req.body
  const subscription = await Subscription.findById(req.params.id)
  if (!subscription) return respond(res, 404, 'Subscription not found')

  subscription.autoRenewal = Boolean(autoRenewal)
  await subscription.save()
  respond(res, 200, 'Auto-renewal updated successfully', { data: subscription, item: subscription })
})

export const markRefund = asyncHandler(async (req, res) => {
  const payment = await PaymentTransaction.findById(req.params.id)
  if (!payment) return respond(res, 404, 'Payment transaction not found')

  payment.status = 'refunded'
  await payment.save()
  respond(res, 200, 'Payment marked as refunded successfully', { data: payment, item: payment })
})
