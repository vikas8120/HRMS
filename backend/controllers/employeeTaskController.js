import asyncHandler from '../utils/asyncHandler.js'
import Task from '../models/Task.js'
import User from '../models/User.js'

const ALLOWED_STATUS = new Set(['pending', 'in-progress', 'completed'])
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high', 'urgent'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const normalizePriority = (value) => String(value || '').trim().toLowerCase()

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

const toTask = (row, scope) => ({
  id: row._id,
  title: row.title || '',
  description: row.description || '',
  assignedEmployeeId: scope.employeeId,
  assignedEmployeeName: scope.name,
  priority: normalizePriority(row.priority || 'medium'),
  status: normalizeStatus(row.status || 'pending'),
  startDate: row.startDate || null,
  dueDate: row.deadline || row.dueDate || null,
  attachments: Array.isArray(row.attachments) ? row.attachments : [],
  comments: Array.isArray(row.comments) ? row.comments : [],
  completedAt: row.completedAt || null,
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null
})

const findScopedTask = async (scope, taskId) => Task.findOne({
  _id: taskId,
  companyId: scope.companyId,
  employeeId: { $in: getLookupKeys(scope) }
})

const isOverdue = (task) => {
  const status = normalizeStatus(task.status)
  if (status === 'completed') return false
  const dueTime = new Date(task.deadline || task.dueDate || '').getTime()
  return Number.isFinite(dueTime) && dueTime < Date.now()
}

const applyUiStatus = (task) => {
  const status = normalizeStatus(task.status || 'pending')
  if (status === 'completed') return 'completed'
  if (status === 'in-progress') return 'in-progress'
  if (isOverdue(task)) return 'pending'
  return 'pending'
}

export const getEmployeeTasks = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: [] })

  const status = normalizeStatus(req.query.status || 'all')
  const priority = normalizePriority(req.query.priority || 'all')
  const dueDate = String(req.query.dueDate || '').trim()

  const query = {
    companyId: scope.companyId,
    employeeId: { $in: getLookupKeys(scope) }
  }

  if (priority !== 'all' && ALLOWED_PRIORITY.has(priority)) query.priority = priority
  if (dueDate) {
    query.$or = [{ deadline: dueDate }, { dueDate }]
  }

  const rows = await Task.find(query).sort({ createdAt: -1 })

  let items = rows.map((row) => {
    const view = toTask(row, scope)
    return { ...view, status: applyUiStatus(row), overdue: isOverdue(row) }
  })

  if (status !== 'all') {
    items = items.filter((item) => item.status === status)
  }

  return res.status(200).json({
    success: true,
    message: 'Tasks fetched successfully',
    data: items
  })
})

export const getEmployeeTaskById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedTask(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Task not found', data: null })

  return res.status(200).json({
    success: true,
    message: 'Task details fetched successfully',
    data: { ...toTask(row, scope), status: applyUiStatus(row), overdue: isOverdue(row) }
  })
})

export const updateEmployeeTaskStatus = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedTask(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Task not found', data: null })

  const nextStatus = normalizeStatus(req.body?.status)
  if (!ALLOWED_STATUS.has(nextStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Use pending, in-progress, or completed', data: null })
  }

  row.status = nextStatus
  if (nextStatus === 'completed') row.completedAt = new Date().toISOString()
  if (nextStatus !== 'completed') row.completedAt = null
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Task status updated successfully',
    data: { ...toTask(row, scope), status: applyUiStatus(row), overdue: isOverdue(row) }
  })
})

export const addEmployeeTaskComment = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const row = await findScopedTask(scope, req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Task not found', data: null })

  const text = String(req.body?.comment || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'comment is required', data: null })

  const comments = Array.isArray(row.comments) ? row.comments : []

  let attachment = null
  if (req.file) {
    attachment = {
      name: req.file.originalname,
      url: `/uploads/documents/${req.file.filename}`
    }
  } else if (req.body?.attachmentUrl || req.body?.attachmentName) {
    attachment = {
      name: String(req.body?.attachmentName || '').trim(),
      url: String(req.body?.attachmentUrl || '').trim()
    }
  }

  const nextComment = {
    id: `${Date.now()}`,
    comment: text,
    authorId: scope.userId,
    authorName: scope.name,
    createdAt: new Date().toISOString()
  }
  if (attachment && (attachment.name || attachment.url)) nextComment.attachment = attachment

  comments.push(nextComment)
  row.comments = comments
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Task comment added successfully',
    data: { ...toTask(row, scope), status: applyUiStatus(row), overdue: isOverdue(row) }
  })
})
