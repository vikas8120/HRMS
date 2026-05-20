import asyncHandler from '../utils/asyncHandler.js'
import ManagerRequest from '../models/ManagerRequest.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_TYPES = new Set([
  'new-employee-requirement',
  'salary-issue',
  'employee-complaint',
  'resource-request',
  'policy-issue',
  'technical-issue',
  'attendance-correction-request',
  'other'
])

const ALLOWED_STATUS = new Set(['draft', 'pending', 'in-review', 'approved', 'rejected', 'resolved', 'closed'])
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high', 'urgent'])

const normalizeType = (value) => String(value || '').trim().toLowerCase()
const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const normalizePriority = (value) => String(value || '').trim().toLowerCase()

const serialize = (item) => ({
  id: item._id,
  requestType: item.requestType || 'other',
  subject: item.subject || '',
  description: item.description || '',
  status: item.status || 'draft',
  priority: item.priority || 'medium',
  raisedTo: item.raisedTo || 'hr_admin',
  managerId: item.managerId || null,
  comments: Array.isArray(item.comments) ? item.comments : [],
  documents: Array.isArray(item.documents) ? item.documents : [],
  timeline: Array.isArray(item.timeline) ? item.timeline : [],
  closedAt: item.closedAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const getScopedRequest = async (req, requestId) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  return ManagerRequest.findOne({ _id: requestId, companyId, managerId })
}

const writeStatusActivity = async ({ companyId, managerId, requestId, nextStatus }) => {
  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_requests',
    action: 'request_status_changed',
    message: `Request ${requestId} moved to ${nextStatus}`,
    metadata: { requestId, status: nextStatus }
  })
}

export const createManagerRequest = asyncHandler(async (req, res) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const {
    requestType = 'other',
    subject = '',
    description = '',
    status = 'pending',
    priority = 'medium',
    raisedTo = 'hr_admin',
    isDraft = false
  } = req.body || {}

  const normalizedType = normalizeType(requestType)
  const normalizedPriority = normalizePriority(priority)
  const normalizedStatus = isDraft ? 'draft' : normalizeStatus(status)

  if (!ALLOWED_TYPES.has(normalizedType)) return res.status(400).json({ success: false, message: 'Invalid requestType' })
  if (!ALLOWED_PRIORITY.has(normalizedPriority)) return res.status(400).json({ success: false, message: 'Invalid priority' })
  if (!ALLOWED_STATUS.has(normalizedStatus)) return res.status(400).json({ success: false, message: 'Invalid status' })
  if (!String(subject).trim()) return res.status(400).json({ success: false, message: 'subject is required' })

  const now = new Date().toISOString()
  const row = await ManagerRequest.create({
    companyId,
    managerId,
    requestType: normalizedType,
    subject: String(subject).trim(),
    description: String(description || '').trim(),
    status: normalizedStatus,
    priority: normalizedPriority,
    raisedTo: String(raisedTo || 'hr_admin').trim(),
    comments: [],
    documents: [],
    timeline: [{ at: now, by: managerId, action: 'created', status: normalizedStatus }]
  })

  await writeStatusActivity({ companyId, managerId, requestId: row._id, nextStatus: normalizedStatus })
  return res.status(201).json({ success: true, message: 'Request submitted successfully', data: serialize(row) })
})

export const getManagerRequests = asyncHandler(async (req, res) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const status = normalizeStatus(req.query.status || 'all')
  const requestType = normalizeType(req.query.requestType || 'all')
  const search = String(req.query.search || '').trim().toLowerCase()

  const query = { companyId, managerId }
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status
  if (requestType !== 'all' && ALLOWED_TYPES.has(requestType)) query.requestType = requestType

  const items = await ManagerRequest.find(query).sort({ createdAt: -1 })
  let rows = items.map(serialize)
  if (search) {
    rows = rows.filter((x) => (`${x.subject} ${x.description} ${x.requestType}`).toLowerCase().includes(search))
  }

  return res.status(200).json({ success: true, data: rows })
})

export const getManagerRequestById = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })
  return res.status(200).json({ success: true, data: serialize(row) })
})

export const updateManagerRequest = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })

  const payload = req.body || {}
  if (payload.subject !== undefined) row.subject = String(payload.subject || '').trim()
  if (payload.description !== undefined) row.description = String(payload.description || '').trim()
  if (payload.requestType !== undefined) {
    const t = normalizeType(payload.requestType)
    if (!ALLOWED_TYPES.has(t)) return res.status(400).json({ success: false, message: 'Invalid requestType' })
    row.requestType = t
  }
  if (payload.priority !== undefined) {
    const p = normalizePriority(payload.priority)
    if (!ALLOWED_PRIORITY.has(p)) return res.status(400).json({ success: false, message: 'Invalid priority' })
    row.priority = p
  }
  if (payload.status !== undefined) {
    const s = normalizeStatus(payload.status)
    if (!ALLOWED_STATUS.has(s)) return res.status(400).json({ success: false, message: 'Invalid status' })
    row.status = s
    row.timeline = [...(row.timeline || []), { at: new Date().toISOString(), by: String(req.user.id), action: 'status_updated', status: s }]
    await writeStatusActivity({ companyId: row.companyId, managerId: String(req.user.id), requestId: row._id, nextStatus: s })
  }
  if (payload.raisedTo !== undefined) row.raisedTo = String(payload.raisedTo || 'hr_admin').trim()

  await row.save()
  return res.status(200).json({ success: true, message: 'Request updated successfully', data: serialize(row) })
})

export const deleteManagerRequest = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })
  await ManagerRequest.deleteOne({ _id: row._id, companyId: row.companyId, managerId: row.managerId })
  return res.status(200).json({ success: true, message: 'Request deleted successfully' })
})

export const addManagerRequestComment = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })
  const comment = String(req.body?.comment || '').trim()
  if (!comment) return res.status(400).json({ success: false, message: 'comment is required' })

  row.comments = [...(row.comments || []), { id: `${Date.now()}`, comment, by: String(req.user.id), at: new Date().toISOString() }]
  await row.save()
  return res.status(200).json({ success: true, message: 'Comment added successfully', data: serialize(row) })
})

export const uploadManagerRequestDocument = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })

  const name = String(req.body?.name || '').trim()
  const url = String(req.body?.url || '').trim()
  const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : ''
  const finalUrl = fileUrl || url
  const finalName = name || req.file?.originalname || 'Attachment'
  if (!finalName && !finalUrl) return res.status(400).json({ success: false, message: 'name/url or file is required' })

  row.documents = [
    ...(row.documents || []),
    { id: `${Date.now()}`, name: finalName, url: finalUrl, by: String(req.user.id), at: new Date().toISOString() }
  ]
  await row.save()

  await ActivityLog.create({
    companyId: row.companyId,
    userId: String(req.user.id),
    module: 'manager_requests',
    action: 'request_document_uploaded',
    message: `Document uploaded on request ${row._id}`,
    metadata: {
      requestId: row._id,
      name: finalName,
      url: finalUrl,
      viaFile: Boolean(req.file)
    }
  })

  return res.status(200).json({ success: true, message: 'Document uploaded successfully', data: serialize(row) })
})

export const closeManagerRequest = asyncHandler(async (req, res) => {
  const row = await getScopedRequest(req, req.params.requestId)
  if (!row) return res.status(404).json({ success: false, message: 'Request not found' })

  row.status = 'closed'
  row.closedAt = new Date().toISOString()
  row.timeline = [...(row.timeline || []), { at: row.closedAt, by: String(req.user.id), action: 'closed', status: 'closed' }]
  await row.save()
  await writeStatusActivity({ companyId: row.companyId, managerId: String(req.user.id), requestId: row._id, nextStatus: 'closed' })

  return res.status(200).json({ success: true, message: 'Request closed successfully', data: serialize(row) })
})
