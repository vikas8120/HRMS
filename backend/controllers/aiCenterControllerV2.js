import asyncHandler from '../utils/asyncHandler.js'
import AISetting from '../models/AISetting.js'
import AIUsageLog from '../models/AIUsageLog.js'
import AutomationRule from '../models/AutomationRule.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'AI Center',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata
  })
}

const insights = {
  'AI Dashboard': { score: 92, summary: 'AI systems healthy with stable inference throughput.' },
  'Attendance Insights': { anomalyRate: 2.4, summary: 'Late arrivals dropped by 6% week-over-week.' },
  'Attrition Prediction': { highRiskEmployees: 14, summary: 'Attrition risk concentrated in engineering and support.' },
  'Payroll Analytics': { variance: 3.1, summary: 'Overtime costs elevated in two business units.' },
  'AI Chatbot': { resolutionRate: 78, summary: 'Self-service ticket deflection is improving.' },
  'Auto Reports': { generatedToday: 37, summary: 'Scheduled reports completed on time.' },
  'Fraud Detection': { alertsOpen: 5, summary: 'Potential anomalies detected in reimbursement patterns.' },
  'AI Usage Analytics': { dailyActiveUsers: 189, summary: 'Usage up 12% month-over-month.' },
  'Automation Rules': { activeRules: 26, summary: 'No failing automation pipelines detected.' }
}

export const getAIInsights = asyncHandler(async (req, res) => {
  const { module = 'AI Dashboard' } = req.query
  const data = insights[module] || { summary: 'No insight model configured yet.' }
  respond(res, 200, 'AI insights fetched successfully', { module, data })
})

export const listAISettings = asyncHandler(async (_req, res) => {
  const items = await AISetting.find().sort({ key: 1 })
  respond(res, 200, 'AI settings fetched successfully', { items })
})

export const upsertAISetting = asyncHandler(async (req, res) => {
  const { key, value, description = '' } = req.body
  if (!key) return respond(res, 400, 'Validation failed: key is required')
  const item = await AISetting.findOneAndUpdate({ key }, { key, value, description }, { upsert: true, new: true, runValidators: true })
  await writeAudit(req, 'UPSERT_AI_SETTING', `AI setting updated: ${key}`, { key })
  respond(res, 200, 'AI setting saved successfully', { item })
})

export const listAIUsageLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, module = 'all' } = req.query
  const query = module === 'all' ? {} : { module }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    AIUsageLog.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    AIUsageLog.countDocuments(query)
  ])
  const pagination = { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
  respond(res, 200, 'AI usage logs fetched successfully', { items, pagination })
})

export const createAIUsageLog = asyncHandler(async (req, res) => {
  const item = await AIUsageLog.create(req.body)
  await writeAudit(req, 'CREATE_AI_USAGE_LOG', `AI usage log created for module ${item.module || 'unknown'}`, { usageLogId: item._id })
  respond(res, 201, 'AI usage log created successfully', { item })
})

export const listAutomationRules = asyncHandler(async (_req, res) => {
  const items = await AutomationRule.find().sort({ createdAt: -1 })
  respond(res, 200, 'AI automation rules fetched successfully', { items })
})

export const createAutomationRule = asyncHandler(async (req, res) => {
  const { name, trigger, action } = req.body
  if (!name || !trigger || !action) return respond(res, 400, 'Validation failed: name, trigger and action are required')
  const item = await AutomationRule.create(req.body)
  await writeAudit(req, 'CREATE_AI_AUTOMATION_RULE', `AI automation rule created: ${item.name}`, { ruleId: item._id })
  respond(res, 201, 'AI automation rule created successfully', { item })
})

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const item = await AutomationRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return respond(res, 404, `Automation rule not found for id: ${req.params.id}`)
  await writeAudit(req, 'UPDATE_AI_AUTOMATION_RULE', `AI automation rule updated: ${item.name}`, { ruleId: item._id })
  respond(res, 200, 'AI automation rule updated successfully', { item })
})
