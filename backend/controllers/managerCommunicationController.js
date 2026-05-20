import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import ManagerMessageThread from '../models/ManagerMessageThread.js'
import ManagerAnnouncement from '../models/ManagerAnnouncement.js'

const toArray = (input) => (Array.isArray(input) ? input : [])
const normalizeParticipants = (input) => [...new Set(toArray(input).map((x) => String(x || '').trim()).filter(Boolean))]

const buildScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email')
  const hrAdmins = await User.find({ companyId, role: { $in: ['hr', 'admin'] } }).select('_id employeeId name email role')

  const teamSet = new Set()
  const allParticipantMap = {}

  for (const x of team) {
    const id = String(x._id)
    const employeeId = String(x.employeeId || x._id)
    const row = { id, userId: id, employeeId, name: x.name || '-', email: x.email || '-', role: 'employee' }
    teamSet.add(id)
    teamSet.add(employeeId)
    allParticipantMap[id] = row
    allParticipantMap[employeeId] = row
  }
  for (const x of hrAdmins) {
    const id = String(x._id)
    const employeeId = String(x.employeeId || x._id)
    const row = { id, userId: id, employeeId, name: x.name || '-', email: x.email || '-', role: x.role || 'hr' }
    allParticipantMap[id] = row
    allParticipantMap[employeeId] = row
  }

  return { companyId, managerId, teamSet, allParticipantMap }
}

const serializeThread = (item, map = {}, managerId = '') => {
  const participants = toArray(item.participants).map((id) => map[String(id)] || { userId: id, name: '-', email: '-', role: '-' })
  const unreadBy = item.unreadBy || {}
  const unreadCount = Number(unreadBy[String(managerId)] || 0)
  return {
    id: item._id,
    threadType: item.threadType || 'team',
    subject: item.subject || '',
    participants,
    messages: toArray(item.messages),
    unreadCount,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

const serializeAnnouncement = (item, map = {}) => ({
  id: item._id,
  title: item.title || '',
  message: item.message || '',
  participants: toArray(item.participants).map((id) => map[String(id)] || { userId: id, name: '-', email: '-' }),
  attachments: toArray(item.attachments),
  status: item.status || 'published',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const createManagerMessage = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamSet, allParticipantMap } = await buildScope(req)
  const {
    threadType = 'team',
    participantIds = [],
    subject = '',
    message = '',
    attachmentUrl = '',
    attachmentName = ''
  } = req.body || {}

  const normalizedParticipants = normalizeParticipants(participantIds)
  if (!normalizedParticipants.length) return res.status(400).json({ success: false, message: 'participantIds are required' })
  if (!String(message).trim()) return res.status(400).json({ success: false, message: 'message is required' })

  if (String(threadType) === 'team') {
    if (normalizedParticipants.some((id) => !teamSet.has(id))) {
      return res.status(403).json({ success: false, message: 'Can message assigned employees only' })
    }
  } else if (String(threadType) === 'hr-admin') {
    if (normalizedParticipants.some((id) => !['hr', 'admin'].includes(String(allParticipantMap[id]?.role || '')))) {
      return res.status(403).json({ success: false, message: 'Only HR/Admin participants are allowed for this thread' })
    }
  }

  const participants = [managerId, ...normalizedParticipants]
  const now = new Date().toISOString()
  const msg = {
    id: `${Date.now()}`,
    senderId: managerId,
    message: String(message).trim(),
    attachmentUrl: String(attachmentUrl || '').trim(),
    attachmentName: String(attachmentName || '').trim(),
    createdAt: now
  }
  const unreadBy = {}
  normalizedParticipants.forEach((id) => { unreadBy[String(id)] = 1 })
  unreadBy[managerId] = 0

  const row = await ManagerMessageThread.create({
    companyId,
    managerId,
    threadType: String(threadType) === 'hr-admin' ? 'hr-admin' : 'team',
    participants,
    subject: String(subject || '').trim(),
    messages: [msg],
    unreadBy
  })

  for (const id of normalizedParticipants) {
    await ActivityLog.create({
      companyId,
      userId: id,
      module: 'manager_communication',
      action: 'message_received',
      message: `New message from manager${subject ? `: ${subject}` : ''}`,
      metadata: { threadId: row._id, managerId }
    })
  }

  return res.status(201).json({ success: true, message: 'Message sent successfully', data: serializeThread(row, allParticipantMap, managerId) })
})

export const getManagerMessages = asyncHandler(async (req, res) => {
  const { companyId, managerId, allParticipantMap } = await buildScope(req)
  const threadType = String(req.query.threadType || 'all').trim().toLowerCase()
  const rows = await ManagerMessageThread.find({ companyId, managerId, archived: false }).sort({ updatedAt: -1 })
  const data = rows
    .filter((x) => threadType === 'all' || String(x.threadType || '') === threadType)
    .map((x) => serializeThread(x, allParticipantMap, managerId))
  const unreadCount = data.reduce((sum, t) => sum + Number(t.unreadCount || 0), 0)
  const contacts = Object.values(allParticipantMap)
    .filter((x) => String(x.userId) !== managerId)
    .map((x) => ({ id: x.userId, employeeId: x.employeeId, name: x.name, email: x.email, role: x.role }))
  return res.status(200).json({ success: true, data, unreadCount, contacts })
})

export const getManagerMessageThreadById = asyncHandler(async (req, res) => {
  const { companyId, managerId, allParticipantMap } = await buildScope(req)
  const row = await ManagerMessageThread.findOne({ _id: req.params.threadId, companyId, managerId, archived: false })
  if (!row) return res.status(404).json({ success: false, message: 'Thread not found' })
  row.unreadBy = { ...(row.unreadBy || {}), [managerId]: 0 }
  await row.save()
  return res.status(200).json({ success: true, data: serializeThread(row, allParticipantMap, managerId) })
})

export const replyManagerMessageThread = asyncHandler(async (req, res) => {
  const { companyId, managerId, allParticipantMap } = await buildScope(req)
  const row = await ManagerMessageThread.findOne({ _id: req.params.threadId, companyId, managerId, archived: false })
  if (!row) return res.status(404).json({ success: false, message: 'Thread not found' })

  const message = String(req.body?.message || '').trim()
  const attachmentUrl = String(req.body?.attachmentUrl || '').trim()
  const attachmentName = String(req.body?.attachmentName || '').trim()
  if (!message) return res.status(400).json({ success: false, message: 'message is required' })

  const now = new Date().toISOString()
  const msg = { id: `${Date.now()}`, senderId: managerId, message, attachmentUrl, attachmentName, createdAt: now }
  row.messages = [...toArray(row.messages), msg]

  const unreadBy = { ...(row.unreadBy || {}) }
  for (const pid of toArray(row.participants)) {
    const key = String(pid)
    if (key === managerId) unreadBy[key] = 0
    else unreadBy[key] = Number(unreadBy[key] || 0) + 1
  }
  row.unreadBy = unreadBy
  await row.save()

  return res.status(200).json({ success: true, message: 'Reply sent successfully', data: serializeThread(row, allParticipantMap, managerId) })
})

export const deleteManagerMessage = asyncHandler(async (req, res) => {
  const { companyId, managerId } = await buildScope(req)
  const rows = await ManagerMessageThread.find({ companyId, managerId, archived: false })
  const messageId = String(req.params.messageId || '').trim()
  let updated = false
  for (const row of rows) {
    const nextMessages = toArray(row.messages).filter((m) => String(m.id) !== messageId)
    if (nextMessages.length !== toArray(row.messages).length) {
      row.messages = nextMessages
      await row.save()
      updated = true
      break
    }
  }
  if (!updated) return res.status(404).json({ success: false, message: 'Message not found' })
  return res.status(200).json({ success: true, message: 'Message deleted successfully' })
})

export const createManagerAnnouncement = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamSet, allParticipantMap } = await buildScope(req)
  const { title = '', message = '', participantIds = [], attachments = [] } = req.body || {}
  const participants = normalizeParticipants(participantIds)
  if (!String(title).trim() || !String(message).trim()) {
    return res.status(400).json({ success: false, message: 'title and message are required' })
  }
  if (!participants.length) return res.status(400).json({ success: false, message: 'participantIds are required' })
  if (participants.some((id) => !teamSet.has(id))) {
    return res.status(403).json({ success: false, message: 'Announcements can target assigned employees only' })
  }

  const row = await ManagerAnnouncement.create({
    companyId,
    managerId,
    title: String(title).trim(),
    message: String(message).trim(),
    participants,
    attachments: toArray(attachments),
    status: 'published',
    archived: false
  })

  for (const id of participants) {
    await ActivityLog.create({
      companyId,
      userId: id,
      module: 'manager_communication',
      action: 'announcement_received',
      message: `New team announcement: ${row.title}`,
      metadata: { announcementId: row._id, managerId }
    })
  }

  return res.status(201).json({ success: true, message: 'Announcement created successfully', data: serializeAnnouncement(row, allParticipantMap) })
})

export const getManagerAnnouncements = asyncHandler(async (req, res) => {
  const { companyId, managerId, allParticipantMap } = await buildScope(req)
  const rows = await ManagerAnnouncement.find({ companyId, managerId, archived: false }).sort({ createdAt: -1 })
  return res.status(200).json({ success: true, data: rows.map((x) => serializeAnnouncement(x, allParticipantMap)) })
})

export const updateManagerAnnouncement = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamSet, allParticipantMap } = await buildScope(req)
  const row = await ManagerAnnouncement.findOne({ _id: req.params.announcementId, companyId, managerId, archived: false })
  if (!row) return res.status(404).json({ success: false, message: 'Announcement not found' })

  const payload = req.body || {}
  if (payload.title !== undefined) row.title = String(payload.title || '').trim()
  if (payload.message !== undefined) row.message = String(payload.message || '').trim()
  if (payload.participantIds !== undefined) {
    const participants = normalizeParticipants(payload.participantIds)
    if (!participants.length) return res.status(400).json({ success: false, message: 'participantIds are required' })
    if (participants.some((id) => !teamSet.has(id))) {
      return res.status(403).json({ success: false, message: 'Announcements can target assigned employees only' })
    }
    row.participants = participants
  }
  if (payload.attachments !== undefined) row.attachments = toArray(payload.attachments)
  await row.save()
  return res.status(200).json({ success: true, message: 'Announcement updated successfully', data: serializeAnnouncement(row, allParticipantMap) })
})

export const deleteManagerAnnouncement = asyncHandler(async (req, res) => {
  const { companyId, managerId } = await buildScope(req)
  const result = await ManagerAnnouncement.deleteOne({ _id: req.params.announcementId, companyId, managerId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Announcement not found' })
  return res.status(200).json({ success: true, message: 'Announcement deleted successfully' })
})
