import asyncHandler from '../utils/asyncHandler.js'
import EmployeeDocument from '../models/EmployeeDocument.js'
import User from '../models/User.js'
import CompanySettings from '../models/CompanySettings.js'

const ALLOWED_CATEGORY = new Set(['id-proof', 'address-proof', 'education', 'experience', 'tax', 'bank', 'other'])
const ALLOWED_STATUS = new Set(['active', 'expired', 'pending'])

const toItem = (row, scope) => ({
  id: row._id,
  title: row.title || '',
  employeeId: scope.employeeId,
  employeeName: scope.name,
  employeeEmail: scope.email,
  category: row.category || 'other',
  documentNumber: row.documentNumber || '',
  fileUrl: row.fileUrl || '',
  notes: row.notes || '',
  issueDate: row.issueDate || null,
  expiryDate: row.expiryDate || null,
  status: row.status || 'active',
  verified: Boolean(row.verified),
  verifiedAt: row.verifiedAt || null,
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null
})

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)

  const employee = await User.findOne({
    _id: userId,
    companyId,
    role: 'employee',
    status: 'active'
  }).select('_id employeeId name email')

  if (!employee) return null

  return {
    companyId,
    userId,
    employeeId: String(employee.employeeId || employee._id),
    name: employee.name || '-',
    email: employee.email || '-'
  }
}

const getLookupKeys = (scope) => [...new Set([String(scope.employeeId), String(scope.userId)])]

const getRequiredDocSummary = async (companyId, docs = []) => {
  const settings = await CompanySettings.findOne({ companyId }).select('documentPolicy')
  const requiredCategories = Array.isArray(settings?.documentPolicy?.requiredCategories)
    ? settings.documentPolicy.requiredCategories
      .map((x) => String(x || '').trim().toLowerCase())
      .filter((x) => ALLOWED_CATEGORY.has(x) && x !== 'other')
    : []

  const uploadedCategories = new Set(docs.filter((x) => !x.archived).map((x) => String(x.category || '').toLowerCase()))
  const missingCategories = requiredCategories.filter((cat) => !uploadedCategories.has(cat))

  return {
    requiredCategories,
    missingCategories,
    uploadedCount: docs.length,
    missingCount: missingCategories.length
  }
}

const findScopedDocument = async (scope, id) => EmployeeDocument.findOne({
  _id: id,
  companyId: scope.companyId,
  employeeId: { $in: getLookupKeys(scope) },
  archived: false
})

export const getEmployeeDocuments = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const category = String(req.query.category || 'all').trim().toLowerCase()
  const status = String(req.query.status || 'all').trim().toLowerCase()

  const query = {
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) },
    archived: false
  }

  if (category !== 'all' && ALLOWED_CATEGORY.has(category)) query.category = category
  if (status !== 'all' && ALLOWED_STATUS.has(status)) query.status = status

  const docs = await EmployeeDocument.find(query).sort({ createdAt: -1 })
  const required = await getRequiredDocSummary(scope.companyId, docs)

  return res.status(200).json({
    success: true,
    message: 'Documents fetched successfully',
    data: {
      items: docs.map((x) => toItem(x, scope)),
      required
    }
  })
})

export const uploadEmployeeDocument = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const title = String(req.body?.title || '').trim()
  const category = String(req.body?.category || 'other').trim().toLowerCase()
  const documentNumber = String(req.body?.documentNumber || '').trim()
  const notes = String(req.body?.notes || '').trim()
  const issueDate = req.body?.issueDate || null
  const expiryDate = req.body?.expiryDate || null
  const status = String(req.body?.status || 'active').trim().toLowerCase()

  if (!title) return res.status(400).json({ success: false, message: 'title is required', data: null })
  if (!ALLOWED_CATEGORY.has(category)) return res.status(400).json({ success: false, message: 'Invalid category', data: null })
  if (!ALLOWED_STATUS.has(status)) return res.status(400).json({ success: false, message: 'Invalid status', data: null })
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required', data: null })

  const fileUrl = `/uploads/documents/${req.file.filename}`

  const row = await EmployeeDocument.create({
    companyId: scope.companyId,
    title,
    employeeId: scope.employeeId,
    employeeName: scope.name,
    category,
    documentNumber,
    fileUrl,
    notes,
    issueDate,
    expiryDate,
    status,
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
    archived: false,
    createdBy: scope.userId,
    visibility: 'my-private',
    ownerUserId: scope.userId
  })

  return res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: toItem(row, scope)
  })
})

export const getEmployeeDocumentById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedDocument(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Document not found', data: null })

  return res.status(200).json({
    success: true,
    message: 'Document details fetched successfully',
    data: toItem(row, scope)
  })
})

export const updateEmployeeDocument = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedDocument(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Document not found', data: null })

  if (String(row.createdBy || '') !== scope.userId) {
    return res.status(403).json({ success: false, message: 'Only your uploaded document can be updated', data: null })
  }

  const nextTitle = req.body?.title !== undefined ? String(req.body.title || '').trim() : row.title
  const nextCategory = req.body?.category !== undefined ? String(req.body.category || '').trim().toLowerCase() : String(row.category || 'other').toLowerCase()
  const nextStatus = req.body?.status !== undefined ? String(req.body.status || '').trim().toLowerCase() : String(row.status || 'active').toLowerCase()

  if (!nextTitle) return res.status(400).json({ success: false, message: 'title is required', data: null })
  if (!ALLOWED_CATEGORY.has(nextCategory)) return res.status(400).json({ success: false, message: 'Invalid category', data: null })
  if (!ALLOWED_STATUS.has(nextStatus)) return res.status(400).json({ success: false, message: 'Invalid status', data: null })

  row.title = nextTitle
  row.category = nextCategory
  row.status = nextStatus
  row.documentNumber = req.body?.documentNumber !== undefined ? String(req.body.documentNumber || '').trim() : row.documentNumber
  row.notes = req.body?.notes !== undefined ? String(req.body.notes || '').trim() : row.notes
  row.issueDate = req.body?.issueDate !== undefined ? (req.body.issueDate || null) : row.issueDate
  row.expiryDate = req.body?.expiryDate !== undefined ? (req.body.expiryDate || null) : row.expiryDate

  if (req.file) {
    row.fileUrl = `/uploads/documents/${req.file.filename}`
    row.verified = false
    row.verifiedAt = null
    row.verifiedBy = null
  }

  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: toItem(row, scope)
  })
})

export const deleteEmployeeDocument = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedDocument(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Document not found', data: null })

  if (String(row.createdBy || '') !== scope.userId) {
    return res.status(403).json({ success: false, message: 'Only your uploaded document can be deleted', data: null })
  }
  if (Boolean(row.verified)) {
    return res.status(400).json({ success: false, message: 'Verified document cannot be deleted', data: null })
  }

  await EmployeeDocument.deleteOne({ _id: row._id, companyId: scope.companyId })

  return res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
    data: toItem(row, scope)
  })
})
