import asyncHandler from '../utils/asyncHandler.js'
import GlobalUser from '../models/GlobalUser.js'
import UserSession from '../models/UserSession.js'
import LoginAttempt from '../models/LoginAttempt.js'
import DeviceLog from '../models/DeviceLog.js'

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
  res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

export const createGlobalUser = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ message: 'name and email are required' })
  const item = await GlobalUser.create(req.body)
  res.status(201).json({ item })
})

export const updateGlobalUser = asyncHandler(async (req, res) => {
  const item = await GlobalUser.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'User not found' })
  res.status(200).json({ item })
})

export const blockUnblockUser = asyncHandler(async (req, res) => {
  const { status } = req.body
  const valid = ['active', 'blocked', 'inactive']
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' })
  const item = await GlobalUser.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'User not found' })
  item.status = status
  await item.save()
  res.status(200).json({ item })
})

export const forceLogout = asyncHandler(async (req, res) => {
  await UserSession.updateMany({ user: req.params.id, active: true }, { active: false, loggedOutAt: new Date() })
  res.status(200).json({ message: 'User sessions terminated' })
})

export const getLoginHistory = asyncHandler(async (req, res) => {
  const items = await LoginAttempt.find().populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  res.status(200).json({ items })
})

export const getActiveSessions = asyncHandler(async (_req, res) => {
  const items = await UserSession.find({ active: true }).populate('user', 'name email').sort({ loggedInAt: -1 })
  res.status(200).json({ items })
})

export const getFailedAttempts = asyncHandler(async (_req, res) => {
  const items = await LoginAttempt.find({ success: false }).populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  res.status(200).json({ items })
})

export const getDeviceTracking = asyncHandler(async (_req, res) => {
  const items = await DeviceLog.find().populate('user', 'name email').sort({ dateTime: -1 }).limit(500)
  res.status(200).json({ items })
})

export const bulkImportUsers = asyncHandler(async (req, res) => {
  const { users = [] } = req.body
  if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ message: 'users array required' })
  const inserted = await GlobalUser.insertMany(users)
  res.status(201).json({ items: inserted, count: inserted.length })
})

export const bulkExportUsers = asyncHandler(async (_req, res) => {
  const items = await GlobalUser.find().populate('company', 'companyName').sort({ createdAt: -1 })
  res.status(200).json({ items })
})
