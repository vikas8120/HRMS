import asyncHandler from '../utils/asyncHandler.js'
import EmployeeDocument from '../models/EmployeeDocument.js'
import User from '../models/User.js'

const ALLOWED_STATUS = new Set(['active', 'expired', 'pending'])
const ALLOWED_CATEGORY = new Set(['id-proof', 'address-proof', 'education', 'experience', 'tax', 'bank', 'other'])

const serialize = (item, usersById = new Map()) => {
  const employee = usersById.get(String(item.employeeId))
  return {
    id: item._id,
    title: item.title || '',
    employeeId: item.employeeId || '',
    employeeName: employee?.name || item.employeeName || '-',
    employeeEmail: employee?.email || '',
    category: item.category || 'other',
    documentNumber: item.documentNumber || '',
    fileUrl: item.fileUrl || '',
    notes: item.notes || '',
    issueDate: item.issueDate || null,
    expiryDate: item.expiryDate || null,
    status: item.status || 'active',
    verified: Boolean(item.verified),
    verifiedAt: item.verifiedAt || null,
    verifiedBy: item.verifiedBy || null,
    archived: Boolean(item.archived),
    createdBy: item.createdBy || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

export const listDocuments = asyncHandler(async (req, res) => {
  const { search = '', category = 'all', status = 'all', archived = 'false', employeeId = 'all' } = req.query

  const query = { companyId: req.user.companyId, archived: String(archived) === 'true' }
  if (category !== 'all') query.category = String(category)
  if (status !== 'all') query.status = String(status)
  if (employeeId !== 'all') query.employeeId = String(employeeId)

  const [items, employees] = await Promise.all([
    EmployeeDocument.find(query).sort({ createdAt: -1 }),
    User.find({ companyId: req.user.companyId, role: { $in: ['hr', 'manager', 'employee'] } }).select('_id name email role')
  ])

  const usersById = new Map(employees.map((x) => [String(x._id), x]))
  const filtered = items.filter((x) => {
    if (!search) return true
    const s = String(search).toLowerCase()
    return (
      String(x.title || '').toLowerCase().includes(s) ||
      String(x.documentNumber || '').toLowerCase().includes(s) ||
      String(x.fileUrl || '').toLowerCase().includes(s) ||
      String(usersById.get(String(x.employeeId))?.name || '').toLowerCase().includes(s)
    )
  })

  res.status(200).json({
    success: true,
    message: 'Documents fetched successfully',
    items: filtered.map((x) => serialize(x, usersById)),
    employees: employees.map((x) => ({ id: x._id, name: x.name || 'Unnamed', email: x.email || '', role: x.role || '' }))
  })
})

export const createDocument = asyncHandler(async (req, res) => {
  const {
    title,
    employeeId,
    category = 'other',
    documentNumber = '',
    fileUrl = '',
    notes = '',
    issueDate = null,
    expiryDate = null,
    status = 'active'
  } = req.body || {}

  if (!title || !employeeId) {
    return res.status(400).json({ success: false, message: 'title and employeeId are required' })
  }
  if (!ALLOWED_CATEGORY.has(String(category))) {
    return res.status(400).json({ success: false, message: 'Invalid category value' })
  }
  if (!ALLOWED_STATUS.has(String(status))) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId })
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })

  const item = await EmployeeDocument.create({
    companyId: req.user.companyId,
    title: String(title).trim(),
    employeeId: String(employeeId),
    employeeName: employee.name || '',
    category: String(category),
    documentNumber: String(documentNumber || '').trim(),
    fileUrl: String(fileUrl || '').trim(),
    notes: String(notes || '').trim(),
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    status: String(status),
    createdBy: req.user.id,
    archived: false,
    verified: false
  })

  res.status(201).json({ success: true, message: 'Document created successfully', item: serialize(item, new Map([[String(employee._id), employee]])) })
})

export const updateDocument = asyncHandler(async (req, res) => {
  const item = await EmployeeDocument.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' })

  const {
    title,
    employeeId,
    category,
    documentNumber,
    fileUrl,
    notes,
    issueDate,
    expiryDate,
    status
  } = req.body || {}

  if (category !== undefined && !ALLOWED_CATEGORY.has(String(category))) {
    return res.status(400).json({ success: false, message: 'Invalid category value' })
  }
  if (status !== undefined && !ALLOWED_STATUS.has(String(status))) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  if (employeeId !== undefined) {
    const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })
    item.employeeId = String(employeeId)
    item.employeeName = employee.name || ''
  }

  if (title !== undefined) item.title = String(title).trim()
  if (category !== undefined) item.category = String(category)
  if (documentNumber !== undefined) item.documentNumber = String(documentNumber || '').trim()
  if (fileUrl !== undefined) item.fileUrl = String(fileUrl || '').trim()
  if (notes !== undefined) item.notes = String(notes || '').trim()
  if (issueDate !== undefined) item.issueDate = issueDate || null
  if (expiryDate !== undefined) item.expiryDate = expiryDate || null
  if (status !== undefined) item.status = String(status)

  await item.save()

  const employee = await User.findOne({ _id: item.employeeId }).select('_id name email')
  const usersById = new Map(employee ? [[String(employee._id), employee]] : [])
  res.status(200).json({ success: true, message: 'Document updated successfully', item: serialize(item, usersById) })
})

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await EmployeeDocument.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Document not found' })
  res.status(200).json({ success: true, message: 'Document deleted successfully' })
})

export const archiveDocument = asyncHandler(async (req, res) => {
  const item = await EmployeeDocument.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' })

  item.archived = true
  await item.save()
  res.status(200).json({ success: true, message: 'Document archived successfully', item: serialize(item) })
})

export const verifyDocument = asyncHandler(async (req, res) => {
  const item = await EmployeeDocument.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Document not found' })

  item.verified = true
  item.verifiedAt = new Date().toISOString()
  item.verifiedBy = req.user.id
  await item.save()

  res.status(200).json({ success: true, message: 'Document verified successfully', item: serialize(item) })
})

export const uploadDocumentFileHandler = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const fileUrl = `/uploads/documents/${req.file.filename}`
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    file: {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl
    }
  })
})
