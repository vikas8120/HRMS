import asyncHandler from '../utils/asyncHandler.js'
import AuditLog from '../models/AuditLog.js'
import SecuritySetting from '../models/SecuritySetting.js'

const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const defaultSecuritySettings = [
  { key: 'password_policy', group: 'Password Policies', value: { minLength: 8, requireUppercase: true, requireNumber: true }, description: 'Password complexity policy' },
  { key: 'two_factor_auth', group: 'Two-Factor Authentication', value: { enabled: false, methods: ['app', 'sms'] }, description: '2FA global config' },
  { key: 'sso_settings', group: 'SSO Settings', value: { enabled: false, provider: 'SAML' }, description: 'Single Sign-On settings' },
  { key: 'oauth_settings', group: 'OAuth Settings', value: { enabled: false, clientId: '', clientSecret: '' }, description: 'OAuth client settings' },
  { key: 'ip_whitelisting', group: 'IP Whitelisting', value: { enabled: false, ips: [] }, description: 'Allowed IP addresses' },
  { key: 'session_timeout', group: 'Session Timeout', value: { minutes: 30 }, description: 'Session expiry policy' },
  { key: 'captcha_settings', group: 'Captcha Settings', value: { enabled: false, provider: 'mock' }, description: 'Captcha provider settings' },
  { key: 'token_expiry_settings', group: 'Token Expiry Settings', value: { accessTokenMinutes: 60, refreshTokenDays: 7 }, description: 'JWT expiry settings' },
  { key: 'threat_monitoring', group: 'Threat Monitoring', value: { enabled: true, alertLevel: 'medium' }, description: 'Threat detection sensitivity' }
]

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { category = 'all', search = '', page = 1, limit = 20 } = req.query
  const query = {}

  if (category !== 'all') query.category = category
  if (search) {
    query.$or = [
      { action: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { actorName: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    AuditLog.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(query)
  ])

  return respond(res, 200, 'Audit logs fetched successfully', {
    data: items,
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  })
})

export const seedAuditLog = asyncHandler(async (req, res) => {
  const item = await AuditLog.create(req.body)
  return respond(res, 201, 'Audit log created successfully', { data: item, item })
})

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const { category = 'all' } = req.query
  const query = category === 'all' ? {} : { category }
  const items = await AuditLog.find(query).sort({ dateTime: -1 }).limit(2000)
  return respond(res, 200, 'Audit logs exported successfully', { data: items, items, exportedAt: new Date().toISOString(), count: items.length })
})

export const getSecuritySettings = asyncHandler(async (_req, res) => {
  let items = await SecuritySetting.find().sort({ group: 1 })
  if (items.length === 0) {
    items = await SecuritySetting.insertMany(defaultSecuritySettings)
  }
  return respond(res, 200, 'Security settings fetched successfully', { data: items, items })
})

export const upsertSecuritySetting = asyncHandler(async (req, res) => {
  const { key, group, value, description = '' } = req.body
  if (!key || !group) return respond(res, 400, 'key and group are required')

  const item = await SecuritySetting.findOneAndUpdate(
    { key },
    { key, group, value, description },
    { upsert: true, new: true, runValidators: true }
  )

  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || 'Super Admin',
    module: 'Audit & Security',
    action: 'UPDATE_SECURITY_SETTING',
    description: `Updated security setting: ${key}`
  })

  return respond(res, 200, 'Security setting updated successfully', { data: item, item })
})
