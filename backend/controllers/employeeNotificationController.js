import asyncHandler from '../utils/asyncHandler.js'
import ManagerNotification from '../models/ManagerNotification.js'

const ALLOWED_FILTERS = new Set(['all', 'unread', 'attendance', 'leave', 'payroll', 'task', 'system'])

const toNotification = (item) => ({
  id: String(item._id),
  category: item.category || 'system',
  type: item.type || 'system-update',
  title: item.title || '',
  message: item.message || '',
  sourceModule: item.sourceModule || '',
  sourceId: item.sourceId || '',
  actionPath: item.actionPath || '/employee/notifications',
  actionType: item.actionType || 'view',
  metadata: item.metadata || {},
  isRead: Boolean(item.isRead),
  readAt: item.readAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const getEmployeeScope = (req) => ({
  companyId: String(req.user.companyId),
  employeeId: String(req.user.id)
})

const baseQuery = (scope) => ({
  companyId: scope.companyId,
  managerId: scope.employeeId,
  isDeleted: false
})

export const getEmployeeNotifications = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const filter = String(req.query.filter || 'all').trim().toLowerCase()
  const query = baseQuery(scope)

  if (ALLOWED_FILTERS.has(filter) && filter !== 'all' && filter !== 'unread') {
    query.category = filter
  }
  if (filter === 'unread') query.isRead = false

  const rows = await ManagerNotification.find(query).sort({ createdAt: -1 }).limit(500)
  const items = rows.map(toNotification)
  const unreadCount = items.filter((x) => !x.isRead).length

  return res.status(200).json({
    success: true,
    message: 'Notifications fetched successfully',
    data: { items, unreadCount }
  })
})

export const markEmployeeNotificationRead = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const row = await ManagerNotification.findOne({ ...baseQuery(scope), _id: req.params.id })

  if (!row) {
    return res.status(404).json({ success: false, message: 'Notification not found', data: null })
  }

  row.isRead = true
  row.readAt = new Date().toISOString()
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: toNotification(row)
  })
})

export const markAllEmployeeNotificationsRead = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const now = new Date().toISOString()

  await ManagerNotification.updateMany(
    { ...baseQuery(scope), isRead: false },
    { isRead: true, readAt: now }
  )

  const rows = await ManagerNotification.find(baseQuery(scope)).sort({ createdAt: -1 }).limit(500)
  const unreadCount = rows.filter((x) => !x.isRead).length

  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: { unreadCount }
  })
})

export const deleteEmployeeNotification = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const row = await ManagerNotification.findOne({ ...baseQuery(scope), _id: req.params.id })

  if (!row) {
    return res.status(404).json({ success: false, message: 'Notification not found', data: null })
  }

  if (row.metadata && row.metadata.allowDelete === false) {
    return res.status(400).json({ success: false, message: 'This notification cannot be deleted', data: null })
  }

  row.isDeleted = true
  row.deletedAt = new Date().toISOString()
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
    data: { id: String(row._id) }
  })
})
