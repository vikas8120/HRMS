import asyncHandler from '../utils/asyncHandler.js'
import Announcement from '../models/Announcement.js'

const ALLOWED_AUDIENCE = new Set(['all', 'hr', 'manager', 'employee'])
const ALLOWED_PRIORITY = new Set(['low', 'normal', 'high', 'critical'])
const ALLOWED_STATUS = new Set(['draft', 'scheduled', 'published'])

const serialize = (item) => ({
  id: item._id,
  title: item.title || '',
  message: item.message || '',
  audience: item.audience || 'all',
  priority: item.priority || 'normal',
  pinned: Boolean(item.pinned),
  publishAt: item.publishAt || null,
  status: item.status || 'published',
  archived: Boolean(item.archived),
  createdBy: item.createdBy || '',
  acknowledgements: Array.isArray(item.acknowledgements) ? item.acknowledgements : [],
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const listAnnouncements = asyncHandler(async (req, res) => {
  const { search = '', audience = 'all', status = 'all', archived = 'false' } = req.query
  const query = { companyId: req.user.companyId }
  if (audience !== 'all') query.audience = String(audience)
  if (status !== 'all') query.status = String(status)
  query.archived = String(archived) === 'true'

  const items = await Announcement.find(query).sort({ pinned: -1, createdAt: -1 })
  const filtered = items.filter((x) => {
    if (!search) return true
    const s = String(search).toLowerCase()
    return String(x.title || '').toLowerCase().includes(s) || String(x.message || '').toLowerCase().includes(s)
  })

  res.status(200).json({ success: true, message: 'Announcements fetched successfully', items: filtered.map(serialize) })
})

export const createAnnouncement = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    audience = 'all',
    priority = 'normal',
    pinned = false,
    publishAt = null,
    status = 'published'
  } = req.body || {}

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required' })
  }
  if (!ALLOWED_AUDIENCE.has(String(audience))) {
    return res.status(400).json({ success: false, message: 'Invalid audience value' })
  }
  if (!ALLOWED_PRIORITY.has(String(priority))) {
    return res.status(400).json({ success: false, message: 'Invalid priority value' })
  }
  if (!ALLOWED_STATUS.has(String(status))) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  const item = await Announcement.create({
    companyId: req.user.companyId,
    title: String(title).trim(),
    message: String(message).trim(),
    audience: String(audience),
    priority: String(priority),
    pinned: Boolean(pinned),
    publishAt: publishAt || null,
    status: String(status),
    archived: false,
    createdBy: req.user.id,
    acknowledgements: []
  })

  res.status(201).json({ success: true, message: 'Announcement created successfully', item: serialize(item) })
})

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' })

  const {
    title,
    message,
    audience,
    priority,
    pinned,
    publishAt,
    status
  } = req.body || {}

  if (audience !== undefined && !ALLOWED_AUDIENCE.has(String(audience))) {
    return res.status(400).json({ success: false, message: 'Invalid audience value' })
  }
  if (priority !== undefined && !ALLOWED_PRIORITY.has(String(priority))) {
    return res.status(400).json({ success: false, message: 'Invalid priority value' })
  }
  if (status !== undefined && !ALLOWED_STATUS.has(String(status))) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  if (title !== undefined) item.title = String(title).trim()
  if (message !== undefined) item.message = String(message).trim()
  if (audience !== undefined) item.audience = String(audience)
  if (priority !== undefined) item.priority = String(priority)
  if (pinned !== undefined) item.pinned = Boolean(pinned)
  if (publishAt !== undefined) item.publishAt = publishAt || null
  if (status !== undefined) item.status = String(status)
  await item.save()

  res.status(200).json({ success: true, message: 'Announcement updated successfully', item: serialize(item) })
})

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await Announcement.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Announcement not found' })
  res.status(200).json({ success: true, message: 'Announcement deleted successfully' })
})

export const archiveAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' })
  item.archived = true
  await item.save()
  res.status(200).json({ success: true, message: 'Announcement archived successfully', item: serialize(item) })
})

export const acknowledgeAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' })
  const existing = (item.acknowledgements || []).find((x) => String(x.userId) === String(req.user.id))
  if (!existing) {
    item.acknowledgements = [...(item.acknowledgements || []), { userId: req.user.id, at: new Date().toISOString() }]
    await item.save()
  }
  res.status(200).json({ success: true, message: 'Acknowledged successfully', item: serialize(item) })
})

