import asyncHandler from '../utils/asyncHandler.js'
import BackupLog from '../models/BackupLog.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'Backup & Restore',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata
  })
}

export const listBackupLogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 200)
  const type = String(req.query.type || 'all')
  const query = type === 'all' ? {} : { type }
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    BackupLog.find(query).sort({ dateTime: -1 }).skip(skip).limit(limit),
    BackupLog.countDocuments(query)
  ])
  const pagination = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  respond(res, 200, 'Backup logs fetched successfully', { items, pagination })
})

export const runBackupAction = asyncHandler(async (req, res) => {
  const { type, mode = 'manual', target = '', encryption = false, cloudProvider = '', details = '' } = req.body
  if (!type) return respond(res, 400, 'Validation failed: type is required for backup action')
  const item = await BackupLog.create({ type, mode, target, encryption, cloudProvider, details, status: 'success' })
  await writeAudit(req, 'RUN_BACKUP', `Backup run completed for ${type}`, { backupId: item._id, type, mode, target })
  respond(res, 201, 'Backup action completed successfully', { item })
})

export const runRestoreAction = asyncHandler(async (req, res) => {
  const { type, target = '', details = '' } = req.body
  if (!type) return respond(res, 400, 'Validation failed: type is required for restore action')
  const item = await BackupLog.create({ type, mode: 'manual', target, details, status: 'restored' })
  await writeAudit(req, 'RUN_RESTORE', `Restore run completed for ${type}`, { restoreId: item._id, type, target })
  respond(res, 201, 'Restore action completed successfully', { item })
})
