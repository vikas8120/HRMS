import asyncHandler from '../utils/asyncHandler.js'
import IntegrationSetting from '../models/IntegrationSetting.js'
import AuditLog from '../models/AuditLog.js'

const defaults = [
  'Biometric Devices','Google Workspace','Microsoft 365','Slack','Zoom','Teams','Payment Gateway','Accounting Software','Email Integration','SMS Gateway','WhatsApp API','Maps API','Webhooks','Third-party Marketplace'
].map((name) => ({ name, category: 'integration' }))

export const listIntegrations = asyncHandler(async (_req, res) => {
  let items = await IntegrationSetting.find().sort({ name: 1 })
  if (items.length === 0) {
    items = await IntegrationSetting.insertMany(defaults)
  }
  res.status(200).json({ items })
})

export const createIntegration = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: 'name is required' })
  const item = await IntegrationSetting.create(req.body)
  res.status(201).json({ item })
})

export const updateIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'Integration not found' })
  res.status(200).json({ item })
})

export const connectIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Integration not found' })

  item.connected = true
  item.status = 'connected'
  item.config = { ...item.config, ...req.body }
  await item.save()

  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || 'Super Admin',
    module: 'Integrations',
    action: 'CONNECT_INTEGRATION',
    description: `Connected integration: ${item.name}`
  })

  res.status(200).json({ item })
})

export const disconnectIntegration = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Integration not found' })

  item.connected = false
  item.status = 'disconnected'
  await item.save()

  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || 'Super Admin',
    module: 'Integrations',
    action: 'DISCONNECT_INTEGRATION',
    description: `Disconnected integration: ${item.name}`
  })

  res.status(200).json({ item })
})

export const testIntegrationConnection = asyncHandler(async (req, res) => {
  const item = await IntegrationSetting.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Integration not found' })

  // Mock test only: no real third-party call
  const isSuccess = true
  item.lastTestAt = new Date()
  item.lastTestStatus = isSuccess ? 'success' : 'failed'
  item.status = isSuccess ? (item.connected ? 'connected' : 'disconnected') : 'error'
  await item.save()

  await AuditLog.create({
    category: 'API Logs',
    actorType: 'super_admin',
    actorName: req.user?.name || 'Super Admin',
    module: 'Integrations',
    action: 'TEST_INTEGRATION_CONNECTION',
    description: `Tested integration connection for ${item.name} (mock)`
  })

  res.status(200).json({ item, message: 'Mock connection test successful' })
})
