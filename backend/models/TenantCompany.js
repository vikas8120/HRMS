import mongoose from 'mongoose'
import crypto from 'crypto'

const branchSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  code: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  manager: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'active' }
}, { _id: true })

const activityLogSchema = new mongoose.Schema({
  action: { type: String, default: '' },
  description: { type: String, default: '' },
  performedBy: { type: String, default: '' },
  dateTime: { type: String, default: () => new Date().toISOString() }
}, { _id: true })

const tenantCompanySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID().replace(/-/g, '') },
  companyName: { type: String, required: true, trim: true },
  companyCode: { type: String, required: true, trim: true, uppercase: true },
  industry: { type: String, default: '' },
  email: { type: String, default: '', lowercase: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  timezone: { type: String, default: '' },
  currency: { type: String, default: '' },
  gst: { type: String, default: '' },
  pan: { type: String, default: '' },
  plan: { type: String, default: 'Starter' },
  employeeLimit: { type: Number, default: 50 },
  employees: { type: Number, default: 0 },
  storageLimit: { type: Number, default: 5 },
  status: { type: String, default: 'active' },
  branding: {
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0f766e' },
    secondaryColor: { type: String, default: '#115e59' },
    customDomain: { type: String, default: '' },
    loginPageBranding: { type: String, default: '' }
  },
  domainSetup: {
    customDomain: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    sslStatus: { type: String, default: 'pending' }
  },
  storageUsage: {
    usedStorage: { type: Number, default: 0 },
    documentsCount: { type: Number, default: 0 },
    backupSize: { type: Number, default: 0 }
  },
  branches: { type: [branchSchema], default: [] },
  configuration: {
    allowSelfOnboarding: { type: Boolean, default: false },
    allowGeoTracking: { type: Boolean, default: false },
    autoBackup: { type: Boolean, default: true }
  },
  suspensionReason: { type: String, default: '' },
  activityLogs: { type: [activityLogSchema], default: [] }
}, {
  collection: 'tenantcompanies',
  timestamps: true,
  versionKey: false
})

tenantCompanySchema.virtual('name').get(function getName() {
  return this.companyName
})

const TenantCompany = mongoose.models.TenantCompany || mongoose.model('TenantCompany', tenantCompanySchema)

export default TenantCompany
