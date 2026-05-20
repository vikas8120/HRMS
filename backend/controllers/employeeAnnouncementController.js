import asyncHandler from '../utils/asyncHandler.js'
import Announcement from '../models/Announcement.js'
import User from '../models/User.js'

const detectType = (item) => {
  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase()
  if (text.includes('holiday') || text.includes('festival')) return 'holiday'
  if (text.includes('policy') || text.includes('guideline') || text.includes('compliance')) return 'policy'
  return item.departmentId ? 'department' : 'company'
}

const hasRead = (item, userId) => {
  const list = Array.isArray(item.acknowledgements) ? item.acknowledgements : []
  return list.some((x) => String(x?.userId || '') === String(userId))
}

const toAnnouncement = (item, user) => ({
  id: item._id,
  title: item.title || '',
  message: item.message || '',
  audience: item.audience || 'all',
  priority: item.priority || 'normal',
  pinned: Boolean(item.pinned),
  publishAt: item.publishAt || null,
  status: item.status || 'published',
  createdBy: item.createdBy || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
  departmentId: item.departmentId || null,
  attachmentUrl: item.attachmentUrl || null,
  attachmentName: item.attachmentName || null,
  read: hasRead(item, user.id),
  filterType: detectType(item)
})

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)

  const employee = await User.findOne({
    _id: userId,
    companyId,
    role: 'employee',
    status: 'active'
  }).select('_id employeeId name email departmentId')

  if (!employee) return null

  return {
    companyId,
    id: String(employee._id),
    employeeId: String(employee.employeeId || employee._id),
    name: employee.name || '-',
    email: employee.email || '-',
    departmentId: employee.departmentId ? String(employee.departmentId) : null
  }
}

const isVisibleToEmployee = (item, scope) => {
  const audience = String(item.audience || 'all').toLowerCase()
  if (!['all', 'employee'].includes(audience)) return false

  if (item.departmentId) {
    if (!scope.departmentId) return false
    return String(item.departmentId) === String(scope.departmentId)
  }

  return true
}

export const getEmployeeAnnouncements = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: [] })

  const view = String(req.query.view || 'all').trim().toLowerCase()

  const rows = await Announcement.find({
    companyId: scope.companyId,
    archived: false,
    status: { $in: ['published', 'scheduled', 'draft'] }
  }).sort({ pinned: -1, createdAt: -1 })

  let items = rows
    .filter((row) => isVisibleToEmployee(row, scope))
    .map((row) => toAnnouncement(row, scope))

  if (view === 'unread') items = items.filter((x) => !x.read)
  if (view === 'company') items = items.filter((x) => !x.departmentId)
  if (view === 'department') items = items.filter((x) => Boolean(x.departmentId))
  if (view === 'policy') items = items.filter((x) => x.filterType === 'policy')
  if (view === 'holiday') items = items.filter((x) => x.filterType === 'holiday')

  return res.status(200).json({
    success: true,
    message: 'Announcements fetched successfully',
    data: items
  })
})

export const getEmployeeAnnouncementById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Announcement.findOne({
    _id: req.params.id,
    companyId: scope.companyId,
    archived: false
  })

  if (!row || !isVisibleToEmployee(row, scope)) {
    return res.status(404).json({ success: false, message: 'Announcement not found', data: null })
  }

  return res.status(200).json({
    success: true,
    message: 'Announcement details fetched successfully',
    data: toAnnouncement(row, scope)
  })
})

export const markEmployeeAnnouncementRead = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await Announcement.findOne({
    _id: req.params.id,
    companyId: scope.companyId,
    archived: false
  })

  if (!row || !isVisibleToEmployee(row, scope)) {
    return res.status(404).json({ success: false, message: 'Announcement not found', data: null })
  }

  const ack = Array.isArray(row.acknowledgements) ? row.acknowledgements : []
  const exists = ack.some((x) => String(x?.userId || '') === String(scope.id))

  if (!exists) {
    ack.push({ userId: scope.id, at: new Date().toISOString() })
    row.acknowledgements = ack
    await row.save()
  }

  return res.status(200).json({
    success: true,
    message: 'Announcement marked as read',
    data: toAnnouncement(row, scope)
  })
})
