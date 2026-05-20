import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const uri = process.env.MONGO_URI || process.env.MONGODB_URI
if (!uri) {
  console.error('Missing MONGO_URI (or MONGODB_URI) in backend/.env')
  process.exit(1)
}

const documentRowSchema = new mongoose.Schema({
  rowId: String,
  model: String,
  docId: String,
  data: mongoose.Schema.Types.Mixed
}, { collection: 'documents', timestamps: true, versionKey: false })

const tenantCompanySchema = new mongoose.Schema({
  _id: String,
  companyName: String,
  companyCode: String,
  industry: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  country: String,
  timezone: String,
  currency: String,
  gst: String,
  pan: String,
  plan: String,
  employeeLimit: Number,
  employees: Number,
  storageLimit: Number,
  status: String,
  branding: mongoose.Schema.Types.Mixed,
  domainSetup: mongoose.Schema.Types.Mixed,
  storageUsage: mongoose.Schema.Types.Mixed,
  branches: [mongoose.Schema.Types.Mixed],
  configuration: mongoose.Schema.Types.Mixed,
  suspensionReason: String,
  activityLogs: [mongoose.Schema.Types.Mixed]
}, { collection: 'tenantcompanies', timestamps: true, versionKey: false })

const DocumentRow = mongoose.models.DocumentRowMigration || mongoose.model('DocumentRowMigration', documentRowSchema)
const TenantCompany = mongoose.models.TenantCompanyMigration || mongoose.model('TenantCompanyMigration', tenantCompanySchema)

const run = async () => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  console.log('Connected to MongoDB')

  const rows = await DocumentRow.find({ model: 'TenantCompany' }).lean()
  console.log(`Found ${rows.length} TenantCompany rows in documents`)

  let created = 0
  let updated = 0

  for (const row of rows) {
    const payload = { ...(row.data || {}) }
    const id = String(row.docId)
    const update = {
      ...payload,
      createdAt: row.createdAt || payload.createdAt || new Date(),
      updatedAt: row.updatedAt || payload.updatedAt || new Date()
    }

    const existing = await TenantCompany.findById(id).lean()
    if (existing) {
      await TenantCompany.updateOne({ _id: id }, { $set: update })
      updated += 1
    } else {
      await TenantCompany.create({ _id: id, ...update })
      created += 1
    }
  }

  console.log(`Migration complete. created=${created}, updated=${updated}`)
  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error(`Migration failed: ${error.message}`)
  try { await mongoose.disconnect() } catch (_e) {}
  process.exit(1)
})
