import asyncHandler from '../utils/asyncHandler.js'
import BackupLog from '../models/BackupLog.js'

export const listBackupLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'all' } = req.query
  const query = type === 'all' ? {} : { type }
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    BackupLog.find(query).sort({ dateTime: -1 }).skip(skip).limit(Number(limit)),
    BackupLog.countDocuments(query)
  ])
  res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

export const runBackupAction = asyncHandler(async (req, res) => {
  const { type, mode = 'manual', target = '', encryption = false, cloudProvider = '', details = '' } = req.body
  if (!type) return res.status(400).json({ message: 'type is required' })
  const item = await BackupLog.create({ type, mode, target, encryption, cloudProvider, details, status: 'success' })
  res.status(201).json({ item, message: 'Backup simulation completed successfully' })
})

export const runRestoreAction = asyncHandler(async (req, res) => {
  const { type, target = '', details = '' } = req.body
  if (!type) return res.status(400).json({ message: 'type is required' })
  const item = await BackupLog.create({ type, mode: 'manual', target, details, status: 'restored' })
  res.status(201).json({ item, message: 'Restore simulation completed successfully' })
})
