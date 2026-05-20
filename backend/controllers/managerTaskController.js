import asyncHandler from '../utils/asyncHandler.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_STATUS = new Set(['pending', 'in-progress', 'completed', 'overdue', 'cancelled'])
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high', 'urgent'])

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()
const normalizePriority = (value) => String(value || '').trim().toLowerCase()

const computeStatus = (item) => {
  const status = normalizeStatus(item.status)
  if (status === 'completed' || status === 'cancelled') return status
  const deadline = new Date(item.deadline || item.dueDate || '').getTime()
  if (Number.isFinite(deadline) && deadline < Date.now()) return 'overdue'
  return status || 'pending'
}

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email designation departmentId')

  const teamKeySet = new Set()
  const employeeMap = {}
  for (const emp of team) {
    const base = {
      id: String(emp._id),
      employeeId: String(emp.employeeId || emp._id),
      name: emp.name || '-',
      email: emp.email || '-',
      designation: emp.designation || '-',
      departmentId: emp.departmentId || null
    }
    teamKeySet.add(base.id)
    teamKeySet.add(base.employeeId)
    employeeMap[base.id] = base
    employeeMap[base.employeeId] = base
  }

  return { companyId, managerId, team, teamKeySet, employeeMap }
}

const serializeTask = (item, employeeMap = {}) => {
  const emp = employeeMap[String(item.employeeId || '')] || {}
  return {
    id: item._id,
    title: item.title || '',
    description: item.description || '',
    assignedEmployeeId: emp.employeeId || item.employeeId || null,
    assignedEmployeeName: emp.name || '-',
    priority: normalizePriority(item.priority || 'medium'),
    status: computeStatus(item),
    startDate: item.startDate || null,
    deadline: item.deadline || item.dueDate || null,
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    comments: Array.isArray(item.comments) ? item.comments : [],
    isDraft: Boolean(item.isDraft),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

const parseAttachments = (input) => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => ({
      name: String(item?.name || '').trim(),
      url: String(item?.url || '').trim()
    }))
    .filter((item) => item.name || item.url)
}

const getScopedTaskById = async (req, taskId) => {
  const { companyId, managerId, teamKeySet } = await buildTeamScope(req)
  const task = await Task.findOne({ _id: taskId, companyId, assignedBy: managerId })
  if (!task) return null
  if (!teamKeySet.has(String(task.employeeId || ''))) return null
  return task
}

export const createManagerTask = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const {
    title,
    description = '',
    assignedEmployeeId,
    priority = 'medium',
    status = 'pending',
    startDate = null,
    deadline = null,
    attachments = [],
    isDraft = false
  } = req.body || {}

  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, message: 'title is required' })
  }
  if (!assignedEmployeeId || !teamKeySet.has(String(assignedEmployeeId))) {
    return res.status(403).json({ success: false, message: 'Task can be assigned only to your team members' })
  }
  const normalizedPriority = normalizePriority(priority)
  if (!ALLOWED_PRIORITY.has(normalizedPriority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority value' })
  }
  const normalizedStatus = normalizeStatus(status)
  if (!ALLOWED_STATUS.has(normalizedStatus) && !isDraft) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  const task = await Task.create({
    companyId,
    assignedBy: managerId,
    employeeId: String(assignedEmployeeId),
    title: String(title).trim(),
    description: String(description || '').trim(),
    priority: normalizedPriority,
    status: isDraft ? 'pending' : normalizedStatus,
    startDate: startDate || null,
    deadline: deadline || null,
    dueDate: deadline || null,
    attachments: parseAttachments(attachments),
    comments: [],
    isDraft: Boolean(isDraft),
    completedAt: null
  })

  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_tasks',
    action: 'task_created',
    message: `Task ${task._id} created`,
    metadata: { taskId: task._id, employeeId: task.employeeId }
  })

  return res.status(201).json({ success: true, message: 'Task created successfully', data: serializeTask(task, employeeMap) })
})

export const getManagerTasks = asyncHandler(async (req, res) => {
  const { companyId, managerId, teamKeySet, employeeMap } = await buildTeamScope(req)
  const status = normalizeStatus(req.query.status || 'all')
  const priority = normalizePriority(req.query.priority || 'all')
  const employeeId = String(req.query.employeeId || 'all').trim()
  const search = String(req.query.search || '').trim().toLowerCase()

  const query = { companyId, assignedBy: managerId }
  if (employeeId !== 'all') query.employeeId = employeeId
  if (priority !== 'all' && ALLOWED_PRIORITY.has(priority)) query.priority = priority

  const items = await Task.find(query).sort({ createdAt: -1 })
  let rows = items
    .filter((item) => teamKeySet.has(String(item.employeeId || '')))
    .map((item) => serializeTask(item, employeeMap))

  if (status !== 'all') rows = rows.filter((x) => x.status === status)
  if (search) rows = rows.filter((x) => (`${x.title} ${x.description} ${x.assignedEmployeeName}`).toLowerCase().includes(search))

  const stats = {
    total: rows.length,
    pending: rows.filter((x) => x.status === 'pending').length,
    inProgress: rows.filter((x) => x.status === 'in-progress').length,
    completed: rows.filter((x) => x.status === 'completed').length,
    overdue: rows.filter((x) => x.status === 'overdue').length,
    cancelled: rows.filter((x) => x.status === 'cancelled').length,
    drafts: rows.filter((x) => x.isDraft).length
  }

  return res.status(200).json({ success: true, data: rows, stats })
})

export const getManagerTaskById = asyncHandler(async (req, res) => {
  const { employeeMap } = await buildTeamScope(req)
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })
  return res.status(200).json({ success: true, data: serializeTask(task, employeeMap) })
})

export const updateManagerTask = asyncHandler(async (req, res) => {
  const { employeeMap, teamKeySet } = await buildTeamScope(req)
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })

  const payload = req.body || {}
  if (payload.title !== undefined) task.title = String(payload.title || '').trim()
  if (payload.description !== undefined) task.description = String(payload.description || '').trim()
  if (payload.priority !== undefined) {
    const p = normalizePriority(payload.priority)
    if (!ALLOWED_PRIORITY.has(p)) return res.status(400).json({ success: false, message: 'Invalid priority value' })
    task.priority = p
  }
  if (payload.status !== undefined) {
    const s = normalizeStatus(payload.status)
    if (!ALLOWED_STATUS.has(s)) return res.status(400).json({ success: false, message: 'Invalid status value' })
    task.status = s
    if (s === 'completed') task.completedAt = new Date().toISOString()
  }
  if (payload.startDate !== undefined) task.startDate = payload.startDate || null
  if (payload.deadline !== undefined) {
    task.deadline = payload.deadline || null
    task.dueDate = payload.deadline || null
  }
  if (payload.attachments !== undefined) task.attachments = parseAttachments(payload.attachments)
  if (payload.isDraft !== undefined) task.isDraft = Boolean(payload.isDraft)
  if (payload.assignedEmployeeId !== undefined) {
    if (!teamKeySet.has(String(payload.assignedEmployeeId))) {
      return res.status(403).json({ success: false, message: 'Task can be assigned only to your team members' })
    }
    task.employeeId = String(payload.assignedEmployeeId)
  }

  await task.save()
  return res.status(200).json({ success: true, message: 'Task updated successfully', data: serializeTask(task, employeeMap) })
})

export const deleteManagerTask = asyncHandler(async (req, res) => {
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })
  await Task.deleteOne({ _id: task._id, companyId: task.companyId })
  return res.status(200).json({ success: true, message: 'Task deleted successfully' })
})

export const addManagerTaskComment = asyncHandler(async (req, res) => {
  const { managerId, employeeMap } = await buildTeamScope(req)
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })
  const text = String(req.body?.comment || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'comment is required' })
  const comments = Array.isArray(task.comments) ? task.comments : []
  comments.push({ id: `${Date.now()}`, comment: text, authorId: managerId, createdAt: new Date().toISOString() })
  task.comments = comments
  await task.save()
  return res.status(200).json({ success: true, message: 'Comment added successfully', data: serializeTask(task, employeeMap) })
})

export const updateManagerTaskStatus = asyncHandler(async (req, res) => {
  const { employeeMap } = await buildTeamScope(req)
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })
  const status = normalizeStatus(req.body?.status)
  if (!ALLOWED_STATUS.has(status)) return res.status(400).json({ success: false, message: 'Invalid status value' })
  task.status = status
  if (status === 'completed') task.completedAt = new Date().toISOString()
  await task.save()
  return res.status(200).json({ success: true, message: 'Task status updated successfully', data: serializeTask(task, employeeMap) })
})

export const reassignManagerTask = asyncHandler(async (req, res) => {
  const { employeeMap, teamKeySet } = await buildTeamScope(req)
  const task = await getScopedTaskById(req, req.params.taskId)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found in your team scope' })
  const assignedEmployeeId = String(req.body?.assignedEmployeeId || '').trim()
  if (!assignedEmployeeId || !teamKeySet.has(assignedEmployeeId)) {
    return res.status(403).json({ success: false, message: 'Task can be assigned only to your team members' })
  }
  task.employeeId = assignedEmployeeId
  await task.save()
  return res.status(200).json({ success: true, message: 'Task reassigned successfully', data: serializeTask(task, employeeMap) })
})
