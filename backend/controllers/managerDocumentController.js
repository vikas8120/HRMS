import asyncHandler from '../utils/asyncHandler.js'
import EmployeeDocument from '../models/EmployeeDocument.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'
import ManagerDocumentRequest from '../models/ManagerDocumentRequest.js'

const ALLOWED_CATEGORY = new Set(['id-proof', 'address-proof', 'education', 'experience', 'tax', 'bank', 'other'])
const ALLOWED_STATUS = new Set(['active', 'expired', 'pending'])
const ALLOWED_REQUEST_STATUS = new Set(['pending', 'submitted', 'completed', 'rejected', 'cancelled'])

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email')
  const teamKeySet = new Set()
  const employeeMap = {}
  for (const user of team) {
    const id = String(user._id)
    const employeeId = String(user.employeeId || user._id)
    const entry = { id, employeeId, name: user.name || '-', email: user.email || '-' }
    teamKeySet.add(id)
    teamKeySet.add(employeeId)
    employeeMap[id] = entry
    employeeMap[employeeId] = entry
  }
  return { companyId, managerId, teamKeySet, employeeMap }
}

const serializeDoc = (item, employeeMap = {}) => {
  const employee = employeeMap[String(item.employeeId || '')] || {}
  return {
    id: item._id,
    title: item.title || '',
    employeeId: employee.employeeId || item.employeeId || '',
    employeeName: employee.name || item.employeeName || '-',
    employeeEmail: employee.email || '',
    category: item.category || 'other',
    documentNumber: item.documentNumber || '',
    fileUrl: item.fileUrl || '',
    notes: item.notes || '',
    issueDate: item.issueDate || null,
    expiryDate: item.expiryDate || null,
    status: item.status || 'active',
    visibility: item.visibility || 'team',
    ownerUserId: item.ownerUserId || null,
    createdBy: item.createdBy || null,
    createdAt: item.createdAt || null
  }
}

const serializeRequest = (item, employeeMap = {}) => {
  const employee = employeeMap[String(item.employeeId || '')] || {}
  return {
    id: item._id,
    employeeId: employee.employeeId || item.employeeId || '',
    employeeName: employee.name || '-',
    employeeEmail: employee.email || '',
    title: item.title || '',
    description: item.description || '',
    requiredBy: item.requiredBy || null,
    status: item.status || 'pending',
    comments: Array.isArray(item.comments) ? item.comments : [],
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

export const getManagerDocuments = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const search = String(req.query.search || '').trim().toLowerCase()
  const category = String(req.query.category || 'all').trim().toLowerCase()
  const status = String(req.query.status || 'all').trim().toLowerCase()
  const employeeId = String(req.query.employeeId || 'all').trim()
  const scope = String(req.query.scope || 'team').trim().toLowerCase()

  const query = { companyId, archived: false }
  if (category !== 'all' && ALLOWED_CATEGORY.has(category)) query.category = category
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status
  if (scope === 'my') {
    query.visibility = 'my-private'
    query.ownerUserId = managerId
  } else {
    query.visibility = { $ne: 'my-private' }
    if (employeeId !== 'all') query.employeeId = employeeId
  }

  const rows = await EmployeeDocument.find(query).sort({ createdAt: -1 })
  const scopedRows = scope === 'my'
    ? rows.filter((x) => String(x.ownerUserId || '') === managerId)
    : rows.filter((x) => teamKeySet.has(String(x.employeeId || '')))
  let scoped = scopedRows.map((x) => serializeDoc(x, employeeMap))

  if (search) {
    scoped = scoped.filter((x) => (
      `${x.title} ${x.employeeName} ${x.employeeEmail} ${x.category} ${x.documentNumber}`.toLowerCase().includes(search)
    ))
  }

  return res.status(200).json({ success: true, data: scoped })
})

export const uploadManagerDocument = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const {
    title = '',
    employeeId = '',
    category = 'other',
    documentNumber = '',
    notes = '',
    issueDate = null,
    expiryDate = null,
    status = 'active'
  } = req.body || {}

  const scope = String(req.body?.scope || 'team').trim().toLowerCase()
  const targetEmployeeId = String(employeeId || '').trim()
  let effectiveEmployeeId = targetEmployeeId
  let visibility = 'team'
  let ownerUserId = null
  let activityUserId = targetEmployeeId

  if (!String(title).trim()) {
    return res.status(400).json({ success: false, message: 'title is required' })
  }

  if (scope === 'my') {
    effectiveEmployeeId = managerId
    visibility = 'my-private'
    ownerUserId = managerId
    activityUserId = managerId
  } else {
    if (!targetEmployeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required for team document' })
    }
    if (!teamKeySet.has(targetEmployeeId)) {
      return res.status(403).json({ success: false, message: 'Can upload only for assigned employees' })
    }
  }

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  if (!ALLOWED_CATEGORY.has(String(category).toLowerCase())) return res.status(400).json({ success: false, message: 'Invalid category' })
  if (!ALLOWED_STATUS.has(String(status).toLowerCase())) return res.status(400).json({ success: false, message: 'Invalid status' })

  const fileUrl = `/uploads/documents/${req.file.filename}`

  const item = await EmployeeDocument.create({
    companyId,
    title: String(title).trim(),
    employeeId: effectiveEmployeeId,
    employeeName: employeeMap[effectiveEmployeeId]?.name || '',
    category: String(category).toLowerCase(),
    documentNumber: String(documentNumber || '').trim(),
    fileUrl,
    notes: String(notes || '').trim(),
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    status: String(status).toLowerCase(),
    createdBy: managerId,
    visibility,
    ownerUserId,
    archived: false,
    verified: false
  })

  await ActivityLog.create({
    companyId,
    userId: activityUserId,
    module: 'manager_documents',
    action: 'document_uploaded',
    message: visibility === 'my-private' ? `You uploaded a private document: ${item.title}` : `A team document was uploaded for you: ${item.title}`,
    metadata: { documentId: item._id, managerId, visibility }
  })

  return res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: serializeDoc(item, employeeMap),
    file: {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl
    }
  })
})

export const getManagerDocumentById = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const item = await EmployeeDocument.findOne({ _id: req.params.documentId, companyId, archived: false })
  if (!item) {
    return res.status(404).json({ success: false, message: 'Document not found in your scope' })
  }
  const isPrivateDoc = String(item.visibility || '') === 'my-private'
  const isOwner = String(item.ownerUserId || '') === managerId
  if ((isPrivateDoc && !isOwner) || (!isPrivateDoc && !teamKeySet.has(String(item.employeeId || '')))) {
    return res.status(404).json({ success: false, message: 'Document not found in your team scope' })
  }
  return res.status(200).json({ success: true, data: serializeDoc(item, employeeMap) })
})

export const deleteManagerDocument = asyncHandler(async (req, res) => {
  const { companyId, managerId } = await buildTeamScope(req)
  const item = await EmployeeDocument.findOne({ _id: req.params.documentId, companyId, archived: false })
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' })
  const isPrivateDoc = String(item.visibility || '') === 'my-private'
  if (isPrivateDoc && String(item.ownerUserId || '') !== managerId) {
    return res.status(403).json({ success: false, message: 'You can only delete your own private documents' })
  }
  if (!isPrivateDoc && String(item.createdBy || '') !== managerId) {
    return res.status(403).json({ success: false, message: 'Only your uploaded documents can be deleted' })
  }
  await EmployeeDocument.deleteOne({ _id: item._id, companyId })
  return res.status(200).json({ success: true, message: 'Document deleted successfully' })
})

export const createManagerDocumentRequest = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const { employeeId = '', title = '', description = '', requiredBy = null } = req.body || {}
  const targetEmployeeId = String(employeeId || '').trim()

  if (!targetEmployeeId || !teamKeySet.has(targetEmployeeId)) {
    return res.status(403).json({ success: false, message: 'Request can be raised only for assigned employees' })
  }
  if (!String(title).trim()) return res.status(400).json({ success: false, message: 'title is required' })

  const row = await ManagerDocumentRequest.create({
    companyId,
    managerId,
    employeeId: targetEmployeeId,
    title: String(title).trim(),
    description: String(description || '').trim(),
    requiredBy: requiredBy || null,
    status: 'pending',
    comments: []
  })

  await ActivityLog.create({
    companyId,
    userId: targetEmployeeId,
    module: 'manager_documents',
    action: 'document_requested',
    message: `Document requested: ${row.title}`,
    metadata: { requestId: row._id, managerId }
  })

  return res.status(201).json({
    success: true,
    message: 'Document request created',
    data: serializeRequest(row, employeeMap)
  })
})

export const getManagerDocumentRequests = asyncHandler(async (req, res) => {
  const { companyId, managerId, employeeMap } = await buildTeamScope(req)
  const status = String(req.query.status || 'all').trim().toLowerCase()
  const query = { companyId, managerId }
  if (status !== 'all' && ALLOWED_REQUEST_STATUS.has(status)) query.status = status
  const rows = await ManagerDocumentRequest.find(query).sort({ createdAt: -1 })
  return res.status(200).json({ success: true, data: rows.map((x) => serializeRequest(x, employeeMap)) })
})
