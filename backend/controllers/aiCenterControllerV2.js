import asyncHandler from '../utils/asyncHandler.js'
import AISetting from '../models/AISetting.js'
import AIUsageLog from '../models/AIUsageLog.js'
import AutomationRule from '../models/AutomationRule.js'

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
  res.status(200).json({ module, data })
})

export const listAISettings = asyncHandler(async (_req, res) => {
  const items = await AISetting.find().sort({ key: 1 })
  res.status(200).json({ items })
})

export const upsertAISetting = asyncHandler(async (req, res) => {
  const { key, value, description = '' } = req.body
  if (!key) return res.status(400).json({ message: 'key is required' })
  const item = await AISetting.findOneAndUpdate({ key }, { key, value, description }, { upsert: true, new: true, runValidators: true })
  res.status(200).json({ item })
})

export const listAIUsageLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, module = 'all' } = req.query
  const query = module === 'all' ? {} : { module }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    AIUsageLog.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    AIUsageLog.countDocuments(query)
  ])
  res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

export const createAIUsageLog = asyncHandler(async (req, res) => {
  const item = await AIUsageLog.create(req.body)
  res.status(201).json({ item })
})

export const listAutomationRules = asyncHandler(async (_req, res) => {
  const items = await AutomationRule.find().sort({ createdAt: -1 })
  res.status(200).json({ items })
})

export const createAutomationRule = asyncHandler(async (req, res) => {
  const { name, trigger, action } = req.body
  if (!name || !trigger || !action) return res.status(400).json({ message: 'name, trigger and action are required' })
  const item = await AutomationRule.create(req.body)
  res.status(201).json({ item })
})

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const item = await AutomationRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'Rule not found' })
  res.status(200).json({ item })
})
