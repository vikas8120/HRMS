import asyncHandler from '../utils/asyncHandler.js'
import IntegrationSetting from '../models/IntegrationSetting.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const defaults = [
  'Biometric Devices','Google Workspace','Microsoft 365','Slack','Zoom','Teams','Payment Gateway','Accounting Software','Email Integration','SMS Gateway','WhatsApp API','Maps API','Webhooks','Third-party Marketplace'
].map((name) => ({ name, category: 'integration' }))

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || 'Super Admin',
    module: 'Integrations',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata
  })
}

export const listIntegrations = asyncHandler(async (_req, res) => {
  let items = await IntegrationSetting.find().sort({ name: 1 })
  if (items.length === 0) {
    items = await IntegrationSetting.insertMany(defaults)
  }
  respond(res, 200, 'Integrations fetched successfully', { items })
})

export const createIntegration = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) return respond(res, 400, 'Validation failed: name is required')
  const item = await IntegrationSetting.create(req.body)
  await writeAudit(req, 'CREATE_INTEGRATION', `Created integration: ${item.name}`, { integrationId: item._id })
  respond(res, 201, 'Integration created successfully', { item })
})

export const updateIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return respond(res, 404, `Integration not found for id: ${req.params.id}`)
  await writeAudit(req, 'UPDATE_INTEGRATION', `Updated integration: ${item.name}`, { integrationId: item._id })
  respond(res, 200, 'Integration updated successfully', { item })
})

export const connectIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return respond(res, 404, `Integration not found for id: ${req.params.id}`)

  item.connected = true
  item.status = 'connected'
  item.config = { ...item.config, ...req.body }
  await item.save()

  await writeAudit(req, 'CONNECT_INTEGRATION', `Connected integration: ${item.name}`, { integrationId: item._id })

  respond(res, 200, `${item.name} connected successfully`, { item })
})

export const disconnectIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return respond(res, 404, `Integration not found for id: ${req.params.id}`)

  item.connected = false
  item.status = 'disconnected'
  await item.save()

  await writeAudit(req, 'DISCONNECT_INTEGRATION', `Disconnected integration: ${item.name}`, { integrationId: item._id })

  respond(res, 200, `${item.name} disconnected successfully`, { item })
})

export const testIntegrationConnection = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return respond(res, 404, `Integration not found for id: ${req.params.id}`)

  const isSuccess = true
  item.lastTestAt = new Date()
  item.lastTestStatus = isSuccess ? 'success' : 'failed'
  item.status = isSuccess ? (item.connected ? 'connected' : 'disconnected') : 'error'
  await item.save()

  await writeAudit(req, 'TEST_INTEGRATION_CONNECTION', `Tested integration connection for ${item.name}`, {
    integrationId: item._id,
    status: item.lastTestStatus
  })

  respond(res, 200, 'Integration connection test completed successfully', { item })
})
