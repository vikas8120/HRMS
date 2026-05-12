import asyncHandler from '../utils/asyncHandler.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import Subscription from '../models/Subscription.js'
import Invoice from '../models/Invoice.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import Coupon from '../models/Coupon.js'
import AddonService from '../models/AddonService.js'
import TenantCompany from '../models/TenantCompany.js'

const buildCrud = (Model, populate = '') => ({
  list: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status = 'all', type = 'all' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
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
      Model.find(query).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Model.countDocuments(query)
    ])

    res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
  }),
  create: asyncHandler(async (req, res) => {
    const item = await Model.create(req.body)
    res.status(201).json({ item })
  }),
  getById: asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id).populate(populate)
    if (!item) return res.status(404).json({ message: 'Record not found' })
    res.status(200).json({ item })
  }),
  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate)
    if (!item) return res.status(404).json({ message: 'Record not found' })
    res.status(200).json({ item })
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Record not found' })
    await Model.deleteOne({ _id: item._id })
    res.status(200).json({ message: 'Deleted successfully' })
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
  if (!companyId || !amount || !dueDate) return res.status(400).json({ message: 'companyId, amount and dueDate are required' })

  const company = await TenantCompany.findById(companyId)
  if (!company) return res.status(404).json({ message: 'Company not found' })

  const invoiceCount = await Invoice.countDocuments()
  const invoice = await Invoice.create({
    company: companyId,
    subscription: subscriptionId || undefined,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount,
    dueDate,
    status: 'pending'
  })

  res.status(201).json({ item: invoice })
})

export const upgradeDowngradeSubscription = asyncHandler(async (req, res) => {
  const { planId, billingCycle, autoRenewal } = req.body
  const subscription = await Subscription.findById(req.params.id)
  if (!subscription) return res.status(404).json({ message: 'Subscription not found' })

  if (planId) subscription.plan = planId
  if (billingCycle) subscription.billingCycle = billingCycle
  if (autoRenewal !== undefined) subscription.autoRenewal = Boolean(autoRenewal)

  await subscription.save()
  res.status(200).json({ item: subscription })
})

export const toggleAutoRenewal = asyncHandler(async (req, res) => {
  const { autoRenewal } = req.body
  const subscription = await Subscription.findById(req.params.id)
  if (!subscription) return res.status(404).json({ message: 'Subscription not found' })

  subscription.autoRenewal = Boolean(autoRenewal)
  await subscription.save()
  res.status(200).json({ item: subscription })
})

export const markRefund = asyncHandler(async (req, res) => {
  const payment = await PaymentTransaction.findById(req.params.id)
  if (!payment) return res.status(404).json({ message: 'Payment transaction not found' })

  payment.status = 'refunded'
  await payment.save()
  res.status(200).json({ item: payment })
})
