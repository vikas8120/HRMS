import asyncHandler from '../utils/asyncHandler.js'
import SystemSetting from '../models/SystemSetting.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const defaults = [
  { group: 'General Settings', key: 'general_settings', value: { appName: 'HRMS', supportEmail: 'support@hrms.com' } },
  { group: 'Email Settings', key: 'email_settings', value: { smtpHost: '', smtpPort: 587 } },
  { group: 'SMS Settings', key: 'sms_settings', value: { provider: 'mock', senderId: '' } },
  { group: 'WhatsApp Settings', key: 'whatsapp_settings', value: { provider: 'mock', phoneNumberId: '' } },
  { group: 'Notification Templates', key: 'notification_templates', value: { welcome: 'Welcome {{name}}' } },
  { group: 'Timezone Settings', key: 'timezone_settings', value: { timezone: 'Asia/Kolkata' } },
  { group: 'Currency Settings', key: 'currency_settings', value: { currency: 'INR' } },
  { group: 'Language Settings', key: 'language_settings', value: { defaultLanguage: 'en' } },
  { group: 'Theme Management', key: 'theme_management', value: { theme: 'light' } },
  { group: 'Branding Settings', key: 'branding_settings', value: { primaryColor: '#0f766e' } },
  { group: 'Date Format', key: 'date_format', value: { format: 'DD-MM-YYYY' } },
  { group: 'File Upload Limits', key: 'file_upload_limits', value: { maxMb: 25 } },
  { group: 'Maintenance Mode', key: 'maintenance_mode', value: { enabled: false } },
  { group: 'Application Version', key: 'application_version', value: { version: '1.0.0' } }
]

export const listSystemSettings = asyncHandler(async (_req, res) => {
  let items = await SystemSetting.find().sort({ group: 1 })
  if (items.length === 0) {
    items = await SystemSetting.insertMany(defaults)
  }
  respond(res, 200, 'System settings fetched successfully', { items })
})

export const upsertSystemSetting = asyncHandler(async (req, res) => {
  const { key, group, value, description = '' } = req.body
  if (!key || !group) return respond(res, 400, 'Validation failed: key and group are required')
  const item = await SystemSetting.findOneAndUpdate({ key }, { key, group, value, description }, { upsert: true, new: true, runValidators: true })

  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'System Settings',
    action: 'UPSERT_SYSTEM_SETTING',
    description: `Updated system setting: ${key}`,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata: { settingKey: key, group }
  })

  respond(res, 200, 'System setting saved successfully', { item })
})
