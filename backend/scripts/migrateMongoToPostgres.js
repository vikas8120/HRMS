import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { getDocumentRow, getSequelize } from '../config/pgCompat.js'

dotenv.config()

const explicitModelMap = {
  superadmins: 'SuperAdmin',
  tenantcompanies: 'TenantCompany',
  companyadmins: 'CompanyAdmin',
  globalusers: 'GlobalUser',
  supporttickets: 'SupportTicket',
  ticketmessages: 'TicketMessage',
  ticketcategories: 'TicketCategory',
  supportagents: 'SupportAgent',
  subscriptions: 'Subscription',
  subscriptionplans: 'SubscriptionPlan',
  invoices: 'Invoice',
  paymenttransactions: 'PaymentTransaction',
  coupons: 'Coupon',
  addonservices: 'AddonService',
  roles: 'Role',
  permissions: 'Permission',
  integrationsettings: 'IntegrationSetting',
  systemsettings: 'SystemSetting',
  securitysettings: 'SecuritySetting',
  auditlogs: 'AuditLog',
  backuplogs: 'BackupLog',
  reportruns: 'ReportRun',
  aisettings: 'AISetting',
  aiusagelogs: 'AIUsageLog',
  automationrules: 'AutomationRule',
  adminaccesslogs: 'AdminAccessLog',
  adminactivitylogs: 'AdminActivityLog',
  loginattempts: 'LoginAttempt',
  devicelogs: 'DeviceLog',
  usersessions: 'UserSession'
}

const toModelName = (collectionName) => explicitModelMap[collectionName] || collectionName
let sequelize

const migrate = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required for migration')

  sequelize = getSequelize()
  const DocumentRow = getDocumentRow()
  await sequelize.authenticate()
  await DocumentRow.sync()
  await mongoose.connect(process.env.MONGO_URI)

  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  const stats = []

  for (const col of collections) {
    const collectionName = col.name
    const modelName = toModelName(collectionName)
    const docs = await db.collection(collectionName).find({}).toArray()

    let inserted = 0
    for (const raw of docs) {
      const { _id, ...rest } = raw
      const payload = JSON.parse(JSON.stringify(rest))
      await DocumentRow.upsert({ model: modelName, docId: String(_id), data: { _id: String(_id), ...payload } })
      inserted += 1
    }

    stats.push({ collectionName, modelName, inserted })
  }

  await mongoose.disconnect()
  console.table(stats)
  console.log('MongoDB to PostgreSQL migration complete')
}

migrate()
  .then(async () => {
    if (sequelize) await sequelize.close()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error)
    if (sequelize) await sequelize.close()
    process.exit(1)
  })
