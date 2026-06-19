import mongoose from 'mongoose'
import { Company } from '../../models/company.model.js'
import { Invoice } from '../../models/invoice.model.js'
import { Payment } from '../../models/payment.model.js'
import { RevenueAnalyticsRecord } from '../../models/revenueAnalytics.model.js'
import { Subscription } from '../../models/subscription.model.js'

const toId = (value) => String(value || '')
const toPlain = (doc) => {
  if (!doc) return null
  const item = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return { ...item, id: toId(item._id), _id: toId(item._id) }
}

const isRevenuePayment = (payment) => ['completed', 'paid', 'success'].includes(String(payment?.status || '').toLowerCase())

const getPaymentTimestamp = (payment) => new Date(payment?.refundedAt || payment?.updatedAt || payment?.createdAt || Date.now())

const getPlanNameFromSubscription = (subscription) => {
  if (!subscription) return ''
  if (subscription.customPlan && typeof subscription.customPlan === 'object') return subscription.customPlan.name || ''
  if (subscription.plan && typeof subscription.plan === 'object') return subscription.plan.name || ''
  return typeof subscription.plan === 'string' ? subscription.plan : ''
}

const normalizePlanSource = (subscription) => {
  if (!subscription) return 'system'
  if (subscription.customPlan) return 'custom'
  if (subscription.plan) return 'plan'
  return 'system'
}

const createTransactionRecord = (payment) => {
  const invoice = payment.invoice || null
  const subscription = invoice?.subscription || null
  const company = payment.company || invoice?.company || subscription?.company || null
  const timestamp = getPaymentTimestamp(payment)
  const year = String(timestamp.getFullYear())
  const month = `${year}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`
  const amount = Number(payment.amount || 0)
  const signedAmount = String(payment.status || '').toLowerCase() === 'refunded' ? -Math.abs(amount) : amount
  const planName = getPlanNameFromSubscription(subscription) || company?.plan || ''

  return {
    metricType: 'transaction',
    periodType: 'transaction',
    periodKey: month,
    company: company?._id || null,
    companyName: company?.companyName || '',
    subscription: subscription?._id || null,
    invoice: invoice?._id || null,
    payment: payment._id,
    planName,
    planSource: normalizePlanSource(subscription),
    transactionRef: payment.transactionRef || `TX-${toId(payment._id).slice(-6).toUpperCase()}`,
    invoiceNumber: invoice?.invoiceNumber || '',
    amount: Math.abs(amount),
    metricValue: signedAmount,
    method: payment.method || '',
    status: String(payment.status || 'completed').toLowerCase(),
    currency: company?.currency || 'INR',
    sourceUpdatedAt: payment.updatedAt || payment.createdAt || timestamp,
    recordedAt: timestamp,
    metadata: {
      paymentId: toId(payment._id),
      refundedAt: payment.refundedAt || null
    }
  }
}

const groupBy = (items, keyFn) => {
  const grouped = new Map()
  for (const item of items) {
    const key = keyFn(item)
    const current = grouped.get(key) || []
    current.push(item)
    grouped.set(key, current)
  }
  return grouped
}

const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0)

const buildSummaryRecords = ({ payments, subscriptions, companies }) => {
  const records = []
  const revenuePayments = payments.filter(isRevenuePayment)
  const now = new Date()
  const currentYear = now.getFullYear()

  const monthlyGroups = groupBy(revenuePayments, (payment) => {
    const date = getPaymentTimestamp(payment)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })

  const annualGroups = groupBy(revenuePayments, (payment) => String(getPaymentTimestamp(payment).getFullYear()))

  for (const [periodKey, group] of monthlyGroups.entries()) {
    const total = sum(group, (payment) => Number(payment.amount || 0))
    records.push({
      metricType: 'monthly_revenue',
      periodType: 'month',
      periodKey,
      metricValue: total,
      amount: total,
      status: 'active',
      currency: group[0]?.company?.currency || 'INR',
      recordedAt: now,
      sourceUpdatedAt: group[group.length - 1]?.updatedAt || group[group.length - 1]?.createdAt || now,
      metadata: {
        paymentCount: group.length
      }
    })
  }

  for (const [periodKey, group] of annualGroups.entries()) {
    const total = sum(group, (payment) => Number(payment.amount || 0))
    records.push({
      metricType: 'annual_revenue',
      periodType: 'year',
      periodKey,
      metricValue: total,
      amount: total,
      status: 'active',
      currency: group[0]?.company?.currency || 'INR',
      recordedAt: now,
      sourceUpdatedAt: group[group.length - 1]?.updatedAt || group[group.length - 1]?.createdAt || now,
      metadata: {
        paymentCount: group.length
      }
    })
  }

  const currentYearPayments = revenuePayments.filter((payment) => getPaymentTimestamp(payment).getFullYear() === currentYear)
  const recentMonths = ['0', '1', '2'].map((offset) => {
    const date = new Date(currentYear, now.getMonth() - Number(offset), 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
  const recentMonthlyTotals = recentMonths.map((periodKey) => {
    const group = monthlyGroups.get(periodKey) || []
    return sum(group, (payment) => Number(payment.amount || 0))
  })
  const forecast = recentMonthlyTotals.length
    ? recentMonthlyTotals.reduce((total, value) => total + value, 0) / recentMonthlyTotals.length
    : 0

  const activeSubscriptions = subscriptions.filter((subscription) => String(subscription.status || '').toLowerCase() === 'active').length
  const totalSubscriptions = subscriptions.length
  const renewedSubscriptions = subscriptions.filter((subscription) => String(subscription.status || '').toLowerCase() === 'active').length
  const churnedSubscriptions = subscriptions.filter((subscription) => ['expired', 'cancelled'].includes(String(subscription.status || '').toLowerCase())).length
  const renewalRate = totalSubscriptions ? (renewedSubscriptions / totalSubscriptions) * 100 : 0
  const churnRate = totalSubscriptions ? (churnedSubscriptions / totalSubscriptions) * 100 : 0
  const mrr = currentYearPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const arr = currentYearPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0) * 12

  records.push({
    metricType: 'mrr',
    periodType: 'snapshot',
    periodKey: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    metricValue: mrr,
    amount: mrr,
    status: 'active',
    currency: 'INR',
    recordedAt: now,
    sourceUpdatedAt: now,
    metadata: { activeSubscriptions }
  })

  records.push({
    metricType: 'arr',
    periodType: 'snapshot',
    periodKey: String(currentYear),
    metricValue: arr,
    amount: arr,
    status: 'active',
    currency: 'INR',
    recordedAt: now,
    sourceUpdatedAt: now,
    metadata: { currentYearPayments: currentYearPayments.length }
  })

  records.push({
    metricType: 'forecast',
    periodType: 'snapshot',
    periodKey: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    metricValue: forecast,
    amount: forecast,
    status: 'active',
    currency: 'INR',
    recordedAt: now,
    sourceUpdatedAt: now,
    metadata: { recentMonths }
  })

  records.push({
    metricType: 'renewal_rate',
    periodType: 'snapshot',
    periodKey: String(currentYear),
    metricValue: Number(renewalRate.toFixed(2)),
    amount: 0,
    status: 'active',
    currency: 'INR',
    recordedAt: now,
    sourceUpdatedAt: now,
    metadata: {
      activeSubscriptions,
      totalSubscriptions,
      renewedSubscriptions
    }
  })

  records.push({
    metricType: 'churn_rate',
    periodType: 'snapshot',
    periodKey: String(currentYear),
    metricValue: Number(churnRate.toFixed(2)),
    amount: 0,
    status: 'active',
    currency: 'INR',
    recordedAt: now,
    sourceUpdatedAt: now,
    metadata: {
      churnedSubscriptions,
      totalSubscriptions
    }
  })

  const planGroups = groupBy(revenuePayments, (payment) => {
    const invoice = payment.invoice || null
    const subscription = invoice?.subscription || null
    return getPlanNameFromSubscription(subscription) || payment.company?.plan || 'Unassigned'
  })
  for (const [planName, group] of planGroups.entries()) {
    const total = sum(group, (payment) => Number(payment.amount || 0))
    records.push({
      metricType: 'revenue_by_plan',
      periodType: 'snapshot',
      periodKey: String(currentYear),
      planName,
      metricValue: total,
      amount: total,
      status: 'active',
      currency: group[0]?.company?.currency || 'INR',
      recordedAt: now,
      sourceUpdatedAt: group[group.length - 1]?.updatedAt || group[group.length - 1]?.createdAt || now,
      metadata: {
        paymentCount: group.length
      }
    })
  }

  const customerGroups = groupBy(revenuePayments, (payment) => payment.company?._id ? String(payment.company._id) : String(payment.company || 'unknown'))
  for (const [companyId, group] of customerGroups.entries()) {
    const total = sum(group, (payment) => Number(payment.amount || 0))
    records.push({
      metricType: 'top_paying_customer',
      periodType: 'snapshot',
      periodKey: String(currentYear),
      company: mongoose.Types.ObjectId.isValid(companyId) ? new mongoose.Types.ObjectId(companyId) : null,
      companyName: group[0]?.company?.companyName || '',
      metricValue: total,
      amount: total,
      status: 'active',
      currency: group[0]?.company?.currency || 'INR',
      recordedAt: now,
      sourceUpdatedAt: group[group.length - 1]?.updatedAt || group[group.length - 1]?.createdAt || now,
      metadata: {
        paymentCount: group.length
      }
    })
  }

  return records
}

const refreshAnalyticsFromBilling = async () => {
  const [payments, subscriptions, companies, invoices] = await Promise.all([
    Payment.find({}).populate('company').populate({ path: 'invoice', populate: { path: 'subscription', populate: ['plan', 'customPlan', 'company'] } }).sort({ createdAt: 1 }),
    Subscription.find({}).populate('company').populate('plan').populate('customPlan').sort({ createdAt: 1 }),
    Company.find({}).sort({ createdAt: 1 }),
    Invoice.find({}).populate('company').populate({ path: 'subscription', populate: ['plan', 'customPlan', 'company'] }).sort({ createdAt: 1 })
  ])

  const paymentRecords = payments.map((payment) => createTransactionRecord(payment))
  const summaryRecords = buildSummaryRecords({ payments, subscriptions, companies, invoices })
  const records = [...paymentRecords, ...summaryRecords]

  await RevenueAnalyticsRecord.deleteMany({})
  if (records.length) await RevenueAnalyticsRecord.insertMany(records)
  return records.length
}

const normalizeView = (value) => String(value || 'monthly-revenue').trim().toLowerCase()

export const syncRevenueAnalytics = async () => refreshAnalyticsFromBilling()

export const syncRevenueAnalyticsSafely = async () => {
  try {
    return await refreshAnalyticsFromBilling()
  } catch (error) {
    console.error('Failed to sync revenue analytics', error)
    return 0
  }
}

export const listRevenueAnalytics = async (query = {}) => {
  const view = normalizeView(query.view || query.metricType)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Number(query.limit) || 10)
  const search = String(query.search || '').trim().toLowerCase()
  const status = String(query.status || 'all').trim().toLowerCase()

  if (await RevenueAnalyticsRecord.countDocuments() === 0) {
    await refreshAnalyticsFromBilling()
  }

  const dbQuery = {}
  const viewMap = {
    'monthly-revenue': ['transaction', 'monthly_revenue'],
    'annual-revenue': ['transaction', 'annual_revenue'],
    'mrr-analytics': ['mrr', 'monthly_revenue'],
    'arr-analytics': ['arr', 'annual_revenue'],
    'revenue-forecasting': ['forecast'],
    'renewal-rate': ['renewal_rate'],
    'churn-analytics': ['churn_rate'],
    'revenue-by-plan': ['revenue_by_plan'],
    'top-paying-customers': ['top_paying_customer']
  }

  dbQuery.metricType = { $in: viewMap[view] || ['transaction'] }
  if (status !== 'all') dbQuery.status = status
  if (search) {
    dbQuery.$or = [
      { transactionRef: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { planName: { $regex: search, $options: 'i' } },
      { method: { $regex: search, $options: 'i' } }
    ]
  }

  const sort = view === 'annual-revenue' || view === 'arr-analytics' || view === 'revenue-by-plan' || view === 'top-paying-customers'
    ? { metricValue: -1, createdAt: -1 }
    : { recordedAt: -1, createdAt: -1 }

  const [items, total] = await Promise.all([
    RevenueAnalyticsRecord.find(dbQuery).sort(sort).skip((page - 1) * limit).limit(limit),
    RevenueAnalyticsRecord.countDocuments(dbQuery)
  ])

  return {
    items: items.map(toPlain),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  }
}

export const getRevenueAnalyticsSummary = async () => {
  if (await RevenueAnalyticsRecord.countDocuments() === 0) {
    await refreshAnalyticsFromBilling()
  }
  const [monthlyRevenue, annualRevenue, mrr, arr, forecast, renewalRate, churnRate] = await Promise.all([
    RevenueAnalyticsRecord.find({ metricType: 'monthly_revenue' }).sort({ periodKey: -1 }).limit(12),
    RevenueAnalyticsRecord.find({ metricType: 'annual_revenue' }).sort({ periodKey: -1 }).limit(5),
    RevenueAnalyticsRecord.findOne({ metricType: 'mrr' }).sort({ createdAt: -1 }),
    RevenueAnalyticsRecord.findOne({ metricType: 'arr' }).sort({ createdAt: -1 }),
    RevenueAnalyticsRecord.findOne({ metricType: 'forecast' }).sort({ createdAt: -1 }),
    RevenueAnalyticsRecord.findOne({ metricType: 'renewal_rate' }).sort({ createdAt: -1 }),
    RevenueAnalyticsRecord.findOne({ metricType: 'churn_rate' }).sort({ createdAt: -1 })
  ])

  return {
    monthlyRevenue: monthlyRevenue.map(toPlain),
    annualRevenue: annualRevenue.map(toPlain),
    mrr: toPlain(mrr),
    arr: toPlain(arr),
    forecast: toPlain(forecast),
    renewalRate: toPlain(renewalRate),
    churnRate: toPlain(churnRate)
  }
}
