import asyncHandler from '../utils/asyncHandler.js'
import GlobalUser from '../models/GlobalUser.js'
import UserSession from '../models/UserSession.js'
import LoginAttempt from '../models/LoginAttempt.js'
import DeviceLog from '../models/DeviceLog.js'
import AuditLog from '../models/AuditLog.js'

const respond = (res, status, message, payload = {}) =>
  res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    category: 'User Activity Logs',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'Global Users',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata
  })
}

export const listGlobalUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query
  const query = {}
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
  if (status !== 'all') query.status = status
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    GlobalUser.find(query).populate('company', 'companyName').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    GlobalUser.countDocuments(query)
  ])
  const pagination = { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
  respond(res, 200, 'Global users fetched successfully', { items, pagination })
})

export const createGlobalUser = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return respond(res, 400, 'Validation failed: name and email are required')
  const item = await GlobalUser.create(req.body)
  await writeAudit(req, 'CREATE_GLOBAL_USER', `Global user created: ${item.email}`, { userId: item._id })
  respond(res, 201, 'Global user created successfully', { item })
})

export const updateGlobalUser = asyncHandler(async (req, res) => {
  const item = await GlobalUser.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return respond(res, 404, `Global user not found for id: ${req.params.id}`)
  await writeAudit(req, 'UPDATE_GLOBAL_USER', `Global user updated: ${item.email}`, { userId: item._id })
  respond(res, 200, 'Global user updated successfully', { item })
})

export const blockUnblockUser = asyncHandler(async (req, res) => {
  const { status } = req.body
  const valid = ['active', 'blocked', 'inactive']
  if (!valid.includes(status)) return respond(res, 400, 'Validation failed: status must be one of active, blocked, inactive')
  const item = await GlobalUser.findById(req.params.id)
  if (!item) return respond(res, 404, `Global user not found for id: ${req.params.id}`)
  item.status = status
  await item.save()
  await writeAudit(req, 'UPDATE_GLOBAL_USER_STATUS', `Global user status changed to ${status}: ${item.email}`, { userId: item._id, status })
  respond(res, 200, `Global user status updated to ${status}`, { item })
})

export const forceLogout = asyncHandler(async (req, res) => {
  await UserSession.updateMany({ user: req.params.id, active: true }, { active: false, loggedOutAt: new Date() })
  await writeAudit(req, 'FORCE_LOGOUT_GLOBAL_USER', `Forced logout for user ${req.params.id}`, { userId: req.params.id })
  respond(res, 200, 'User sessions terminated successfully', { userId: req.params.id })
})

export const getLoginHistory = asyncHandler(async (req, res) => {
  const items = await LoginAttempt.find().populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  respond(res, 200, 'Login history fetched successfully', { items })
})

export const getActiveSessions = asyncHandler(async (_req, res) => {
  const items = await UserSession.find({ active: true }).populate('user', 'name email').sort({ loggedInAt: -1 })
  respond(res, 200, 'Active sessions fetched successfully', { items })
})

export const getFailedAttempts = asyncHandler(async (_req, res) => {
  const items = await LoginAttempt.find({ success: false }).populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  respond(res, 200, 'Failed login attempts fetched successfully', { items })
})

export const getDeviceTracking = asyncHandler(async (_req, res) => {
  const items = await DeviceLog.find().populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  respond(res, 200, 'Device tracking fetched successfully', { items })
})

export const bulkImportUsers = asyncHandler(async (req, res) => {
  const { users = [] } = req.body
  if (!Array.isArray(users) || users.length === 0) return respond(res, 400, 'Validation failed: users must be a non-empty array')
  const inserted = await GlobalUser.insertMany(users)
  await writeAudit(req, 'BULK_IMPORT_GLOBAL_USERS', `Bulk imported ${inserted.length} users`, { count: inserted.length })
  respond(res, 201, `Bulk import completed: ${inserted.length} users created`, { items: inserted, count: inserted.length })
})

export const bulkExportUsers = asyncHandler(async (req, res) => {
  const items = await GlobalUser.find().populate('company', 'companyName').sort({ createdAt: -1 })
  await writeAudit(req, 'BULK_EXPORT_GLOBAL_USERS', `Bulk exported ${items.length} users`, { count: items.length })
  respond(res, 200, 'Bulk export prepared successfully', { items, count: items.length })
})
