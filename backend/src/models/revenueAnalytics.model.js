import mongoose from 'mongoose'

const revenueAnalyticsSchema = new mongoose.Schema(
  {
    metricType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: [
        'transaction',
        'monthly_revenue',
        'annual_revenue',
        'mrr',
        'arr',
        'forecast',
        'renewal_rate',
        'churn_rate',
        'revenue_by_plan',
        'top_paying_customer'
      ]
    },
    periodType: { type: String, trim: true, lowercase: true, default: 'snapshot' },
    periodKey: { type: String, trim: true, default: 'all', index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    companyName: { type: String, trim: true, default: '' },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    planName: { type: String, trim: true, default: '' },
    planSource: { type: String, trim: true, lowercase: true, default: 'system' },
    transactionRef: { type: String, trim: true, default: '' },
    invoiceNumber: { type: String, trim: true, default: '' },
    amount: { type: Number, default: 0, min: 0 },
    metricValue: { type: Number, default: 0 },
    method: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, lowercase: true, default: 'completed' },
    currency: { type: String, trim: true, default: 'INR' },
    sourceUpdatedAt: { type: Date, default: null },
    recordedAt: { type: Date, default: Date.now },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true, collection: 'revenue_analytics' }
)

revenueAnalyticsSchema.index({ metricType: 1, periodKey: 1 })
revenueAnalyticsSchema.index({ company: 1, metricType: 1, periodKey: 1 })
revenueAnalyticsSchema.index({ payment: 1 }, { unique: true, sparse: true })

export const RevenueAnalyticsRecord = mongoose.model('RevenueAnalyticsRecord', revenueAnalyticsSchema)
