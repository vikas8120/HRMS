import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import ManagerMeeting from '../models/ManagerMeeting.js'

const ALLOWED_STATUS = new Set(['scheduled', 'completed', 'cancelled'])

const toDateTime = (date, time) => {
  if (!date || !time) return NaN
  return new Date(`${String(date).slice(0, 10)}T${String(time).slice(0, 5)}:00`).getTime()
}

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email')

  const teamKeySet = new Set()
  const employeeMap = {}
  team.forEach((emp) => {
    const id = String(emp._id)
    const employeeId = String(emp.employeeId || emp._id)
    const base = { id, employeeId, name: emp.name || '-', email: emp.email || '-' }
    teamKeySet.add(id)
    teamKeySet.add(employeeId)
    employeeMap[id] = base
    employeeMap[employeeId] = base
  })

  return { companyId, managerId, teamKeySet, employeeMap }
}

const normalizeParticipants = (input) => {
  if (!Array.isArray(input)) return []
  return [...new Set(input.map((x) => String(x || '').trim()).filter(Boolean))]
}

const serializeMeeting = (item, employeeMap = {}) => {
  const participants = Array.isArray(item.participants) ? item.participants : []
  const participantDetails = participants.map((id) => {
    const info = employeeMap[String(id)] || {}
    return {
      employeeId: info.employeeId || String(id),
      name: info.name || '-',
      email: info.email || '-'
    }
  })
  return {
    id: item._id,
    title: item.title || '',
    date: item.date || null,
    startTime: item.startTime || '',
    endTime: item.endTime || '',
    participants: participantDetails,
    agenda: item.agenda || '',
    location: item.location || '',
    meetingLink: item.meetingLink || '',
    notes: Array.isArray(item.notes) ? item.notes : [],
    status: item.status || 'scheduled',
    cancelledAt: item.cancelledAt || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

const getScopedMeeting = async (req, meetingId) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  return ManagerMeeting.findOne({ _id: meetingId, companyId, managerId })
}

const writeActivity = async ({ companyId, managerId, action, message, metadata = {} }) => {
  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_meetings',
    action,
    message,
    metadata
  })
}

const writeEmployeeInviteActivities = async ({ companyId, managerId, meetingId, title, participants }) => {
  for (const employeeId of participants) {
    await ActivityLog.create({
      companyId,
      userId: employeeId,
      module: 'manager_meetings',
      action: 'meeting_invite_received',
      message: `You have a meeting invite: ${title || 'Meeting'}`,
      metadata: { meetingId, managerId }
    })
  }
}

export const createManagerMeeting = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const {
    title = '',
    date = null,
    startTime = '',
    endTime = '',
    participants = [],
    agenda = '',
    location = '',
    meetingLink = '',
    notes = [],
    sendInvite = true
  } = req.body || {}

  if (!String(title).trim()) return res.status(400).json({ success: false, message: 'title is required' })
  if (!date) return res.status(400).json({ success: false, message: 'date is required' })
  if (!String(startTime).trim() || !String(endTime).trim()) {
    return res.status(400).json({ success: false, message: 'startTime and endTime are required' })
  }

  const startTs = toDateTime(date, startTime)
  const endTs = toDateTime(date, endTime)
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
    return res.status(400).json({ success: false, message: 'Invalid meeting time range' })
  }

  const participantIds = normalizeParticipants(participants)
  if (!participantIds.length) return res.status(400).json({ success: false, message: 'At least one participant is required' })
  if (participantIds.some((id) => !teamKeySet.has(String(id)))) {
    return res.status(403).json({ success: false, message: 'Participants must be assigned employees' })
  }

  const row = await ManagerMeeting.create({
    companyId,
    managerId,
    title: String(title).trim(),
    date: String(date).slice(0, 10),
    startTime: String(startTime).slice(0, 5),
    endTime: String(endTime).slice(0, 5),
    participants: participantIds,
    agenda: String(agenda || '').trim(),
    location: String(location || '').trim(),
    meetingLink: String(meetingLink || '').trim(),
    notes: Array.isArray(notes) ? notes : [],
    status: 'scheduled',
    cancelledAt: null
  })

  await writeActivity({
    companyId,
    managerId,
    action: 'meeting_created',
    message: `Meeting ${row._id} created`,
    metadata: { meetingId: row._id, participants: participantIds.length }
  })
  if (Boolean(sendInvite)) {
    await writeEmployeeInviteActivities({ companyId, managerId, meetingId: row._id, title: row.title, participants: participantIds })
  }

  return res.status(201).json({ success: true, message: 'Meeting created successfully', data: serializeMeeting(row, employeeMap) })
})

export const getManagerMeetings = asyncHandler(async (req, res) => {
  const { companyId, managerId, employeeMap } = await buildTeamScope(req)
  const status = String(req.query.status || 'all').trim().toLowerCase()
  const date = String(req.query.date || '').trim()
  const search = String(req.query.search || '').trim().toLowerCase()

  const query = { companyId, managerId }
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status
  if (date) query.date = String(date).slice(0, 10)

  const rows = await ManagerMeeting.find(query).sort({ date: 1, startTime: 1, createdAt: -1 })
  let data = rows.map((item) => serializeMeeting(item, employeeMap))

  data = data.map((row) => {
    const endTs = toDateTime(row.date, row.endTime)
    const nextStatus = row.status === 'cancelled'
      ? 'cancelled'
      : (Number.isFinite(endTs) && endTs < Date.now() ? 'completed' : 'scheduled')
    return { ...row, status: nextStatus }
  })

  if (search) {
    data = data.filter((row) => (
      `${row.title} ${row.agenda} ${row.location} ${row.meetingLink} ${row.participants.map((p) => p.name).join(' ')}`
        .toLowerCase()
        .includes(search)
    ))
  }

  return res.status(200).json({ success: true, data })
})

export const getManagerMeetingById = asyncHandler(async (req, res) => {
  const { employeeMap } = await buildTeamScope(req)
  const row = await getScopedMeeting(req, req.params.meetingId)
  if (!row) return res.status(404).json({ success: false, message: 'Meeting not found' })
  return res.status(200).json({ success: true, data: serializeMeeting(row, employeeMap) })
})

export const updateManagerMeeting = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const row = await getScopedMeeting(req, req.params.meetingId)
  if (!row) return res.status(404).json({ success: false, message: 'Meeting not found' })

  const payload = req.body || {}
  if (payload.title !== undefined) row.title = String(payload.title || '').trim()
  if (payload.date !== undefined) row.date = String(payload.date || '').slice(0, 10)
  if (payload.startTime !== undefined) row.startTime = String(payload.startTime || '').slice(0, 5)
  if (payload.endTime !== undefined) row.endTime = String(payload.endTime || '').slice(0, 5)
  if (payload.agenda !== undefined) row.agenda = String(payload.agenda || '').trim()
  if (payload.location !== undefined) row.location = String(payload.location || '').trim()
  if (payload.meetingLink !== undefined) row.meetingLink = String(payload.meetingLink || '').trim()
  if (payload.status !== undefined) {
    const status = String(payload.status || '').trim().toLowerCase()
    if (!ALLOWED_STATUS.has(status)) return res.status(400).json({ success: false, message: 'Invalid status value' })
    row.status = status
    row.cancelledAt = status === 'cancelled' ? new Date().toISOString() : null
  }
  if (payload.participants !== undefined) {
    const participants = normalizeParticipants(payload.participants)
    if (!participants.length) return res.status(400).json({ success: false, message: 'At least one participant is required' })
    if (participants.some((id) => !teamKeySet.has(String(id)))) {
      return res.status(403).json({ success: false, message: 'Participants must be assigned employees' })
    }
    row.participants = participants
  }

  const startTs = toDateTime(row.date, row.startTime)
  const endTs = toDateTime(row.date, row.endTime)
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
    return res.status(400).json({ success: false, message: 'Invalid meeting time range' })
  }

  await row.save()
  await writeActivity({
    companyId,
    managerId,
    action: 'meeting_updated',
    message: `Meeting ${row._id} updated`,
    metadata: { meetingId: row._id }
  })
  if (Boolean(payload.sendInvite)) {
    await writeEmployeeInviteActivities({
      companyId,
      managerId,
      meetingId: row._id,
      title: row.title,
      participants: Array.isArray(row.participants) ? row.participants : []
    })
  }

  return res.status(200).json({ success: true, message: 'Meeting updated successfully', data: serializeMeeting(row, employeeMap) })
})

export const deleteManagerMeeting = asyncHandler(async (req, res) => {
  const { companyId, managerId } = await buildTeamScope(req)
  const row = await getScopedMeeting(req, req.params.meetingId)
  if (!row) return res.status(404).json({ success: false, message: 'Meeting not found' })
  await ManagerMeeting.deleteOne({ _id: row._id, companyId, managerId })
  await writeActivity({
    companyId,
    managerId,
    action: 'meeting_deleted',
    message: `Meeting ${row._id} cancelled`,
    metadata: { meetingId: row._id }
  })
  return res.status(200).json({ success: true, message: 'Meeting cancelled successfully' })
})

export const addManagerMeetingNotes = asyncHandler(async (req, res) => {
  const { companyId, managerId, employeeMap } = await buildTeamScope(req)
  const row = await getScopedMeeting(req, req.params.meetingId)
  if (!row) return res.status(404).json({ success: false, message: 'Meeting not found' })

  const noteText = String(req.body?.notes || req.body?.note || '').trim()
  if (!noteText) return res.status(400).json({ success: false, message: 'notes is required' })

  row.notes = [...(row.notes || []), { id: `${Date.now()}`, notes: noteText, by: managerId, at: new Date().toISOString() }]
  await row.save()
  await writeActivity({
    companyId,
    managerId,
    action: 'meeting_notes_added',
    message: `Notes added to meeting ${row._id}`,
    metadata: { meetingId: row._id }
  })

  return res.status(200).json({ success: true, message: 'Meeting notes added successfully', data: serializeMeeting(row, employeeMap) })
})
