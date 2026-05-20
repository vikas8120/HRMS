import asyncHandler from '../utils/asyncHandler.js'
import ManagerNotification from '../models/ManagerNotification.js'
import User from '../models/User.js'
import Leave from '../models/Leave.js'
import Task from '../models/Task.js'
import Attendance from '../models/Attendance.js'
import ActivityLog from '../models/ActivityLog.js'

const normalizeDateKey = (value) => {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const isNearDeadline = (value, thresholdHours = 48) => {
  const ts = new Date(value || '').getTime()
  if (!Number.isFinite(ts)) return false
  const now = Date.now()
  const diff = ts - now
  return diff > 0 && diff <= thresholdHours * 60 * 60 * 1000
}

const buildTeamScope = async (req) => {
  const managerId = String(req.user.id)
  const companyId = String(req.user.companyId)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name')
  const teamIds = team.map((x) => String(x._id))
  const attendanceKeys = team.flatMap((x) => [String(x._id), String(x.employeeId || '')].filter(Boolean))
  const employeeNameMap = {}
  team.forEach((x) => {
    const name = x.name || '-'
    employeeNameMap[String(x._id)] = name
    if (x.employeeId) employeeNameMap[String(x.employeeId)] = name
  })
  return { managerId, companyId, teamIds, attendanceKeys, employeeNameMap }
}

const upsertNotification = async (base) => {
  const filter = {
    companyId: base.companyId,
    managerId: base.managerId,
    sourceKey: base.sourceKey
  }

  const existing = await ManagerNotification.findOne(filter)
  if (existing) {
    const next = {
      ...existing,
      category: base.category,
      type: base.type,
      title: base.title,
      message: base.message,
      sourceModule: base.sourceModule,
      sourceId: base.sourceId,
      actionPath: base.actionPath,
      actionType: base.actionType,
      metadata: base.metadata || {}
    }
    await ManagerNotification.updateOne({ _id: existing._id }, next)
    return
  }

  await ManagerNotification.create(base)
}

const seedManagerNotifications = async (req) => {
  const { managerId, companyId, teamIds, attendanceKeys, employeeNameMap } = await buildTeamScope(req)
  if (!teamIds.length) return

  const [pendingLeaves, teamTasks, todayAttendance, hrAdminActivities] = await Promise.all([
    Leave.find({ companyId, employeeId: { $in: attendanceKeys }, status: 'pending' }).select('_id employeeId leaveType createdAt'),
    Task.find({ companyId, employeeId: { $in: teamIds } }).select('_id employeeId title status deadline dueDate updatedAt'),
    Attendance.find({ companyId, employeeId: { $in: attendanceKeys } }).select('_id employeeId status date createdAt'),
    ActivityLog.find({ companyId, module: { $in: ['manager_requests', 'admin_announcement', 'hr_message'] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id module action message metadata createdAt userId')
  ])

  for (const leave of pendingLeaves) {
    const employeeName = employeeNameMap[String(leave.employeeId || '')] || 'Employee'
    await upsertNotification({
      companyId,
      managerId,
      category: 'leave',
      type: 'employee-leave-applied',
      title: 'Leave request pending approval',
      message: `${employeeName} applied for ${leave.leaveType || 'leave'}`,
      sourceModule: 'leave',
      sourceId: String(leave._id),
      sourceKey: `leave-pending-${String(leave._id)}`,
      actionPath: '/manager/leaves',
      actionType: 'approve_leave',
      metadata: { leaveId: String(leave._id), employeeId: String(leave.employeeId || ''), status: 'pending' }
    })
  }

  for (const task of teamTasks) {
    const taskStatus = String(task.status || '').toLowerCase()
    const employeeName = employeeNameMap[String(task.employeeId || '')] || 'Employee'
    const dueAt = task.deadline || task.dueDate
    const overdue = Number.isFinite(new Date(dueAt || '').getTime()) && new Date(dueAt).getTime() < Date.now() && taskStatus !== 'completed'
    if (taskStatus === 'completed' || taskStatus === 'in-progress' || taskStatus === 'overdue') {
      await upsertNotification({
        companyId,
        managerId,
        category: 'task',
        type: 'employee-task-updated',
        title: 'Task updated by employee',
        message: `${employeeName} updated task "${task.title || 'Untitled task'}" to ${taskStatus || 'pending'}`,
        sourceModule: 'task',
        sourceId: String(task._id),
        sourceKey: `task-update-${String(task._id)}-${taskStatus}`,
        actionPath: '/manager/tasks',
        actionType: 'open_task',
        metadata: { taskId: String(task._id), employeeId: String(task.employeeId || ''), status: taskStatus }
      })
    }

    if ((isNearDeadline(dueAt) || overdue) && taskStatus !== 'completed' && taskStatus !== 'cancelled') {
      await upsertNotification({
        companyId,
        managerId,
        category: 'task',
        type: 'task-deadline-near',
        title: overdue ? 'Task is overdue' : 'Task deadline is near',
        message: `${task.title || 'Task'} ${overdue ? 'is overdue' : 'is due soon'}`,
        sourceModule: 'task',
        sourceId: String(task._id),
        sourceKey: `task-deadline-${String(task._id)}-${normalizeDateKey(dueAt)}`,
        actionPath: '/manager/tasks',
        actionType: 'open_task',
        metadata: { taskId: String(task._id), employeeId: String(task.employeeId || ''), deadline: dueAt, overdue }
      })
    }
  }

  const todayKey = normalizeDateKey(new Date())
  for (const row of todayAttendance) {
    const status = String(row.status || '').toLowerCase()
    const rowDay = normalizeDateKey(row.date || row.createdAt)
    if (rowDay !== todayKey) continue
    if (!['absent', 'late', 'half day', 'half-day', 'half_day'].includes(status)) continue

    const employeeName = employeeNameMap[String(row.employeeId || '')] || 'Employee'
    await upsertNotification({
      companyId,
      managerId,
      category: 'attendance',
      type: 'attendance-alert',
      title: 'Attendance alert',
      message: `${employeeName} marked as ${status}`,
      sourceModule: 'attendance',
      sourceId: String(row._id),
      sourceKey: `attendance-alert-${String(row.employeeId)}-${todayKey}-${status}`,
      actionPath: '/manager/attendance',
      actionType: 'open_attendance',
      metadata: { employeeId: String(row.employeeId || ''), status, day: todayKey }
    })
  }

  for (const log of hrAdminActivities) {
    const action = String(log.action || '').toLowerCase()
    const isRequestChange = action.includes('status') || action.includes('resolved') || action.includes('approved') || action.includes('rejected')
    const category = log.module === 'manager_requests' ? 'system' : 'hr-admin'
    await upsertNotification({
      companyId,
      managerId,
      category,
      type: log.module === 'manager_requests' ? 'request-status-changed' : 'hr-admin-message',
      title: log.module === 'manager_requests' ? 'Request status changed' : 'HR/Admin message',
      message: log.message || 'You have a new update',
      sourceModule: log.module || 'activity',
      sourceId: String(log._id),
      sourceKey: `${String(log.module)}-${String(log._id)}`,
      actionPath: log.module === 'manager_requests' && isRequestChange ? '/manager/requests' : '/manager/notifications',
      actionType: log.module === 'manager_requests' ? 'open_request' : 'view',
      metadata: { activityId: String(log._id), module: log.module, action: log.action }
    })
  }
}

const serialize = (item) => ({
  id: item._id,
  category: item.category || 'system',
  type: item.type || 'system-update',
  title: item.title || '',
  message: item.message || '',
  sourceModule: item.sourceModule || '',
  sourceId: item.sourceId || '',
  actionPath: item.actionPath || '/manager/notifications',
  actionType: item.actionType || 'view',
  metadata: item.metadata || {},
  isRead: Boolean(item.isRead),
  readAt: item.readAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const getManagerNotifications = asyncHandler(async (req, res) => {
  await seedManagerNotifications(req)
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const category = String(req.query.category || 'all').trim().toLowerCase()

  const query = { companyId, managerId, isDeleted: false }
  if (category !== 'all') query.category = category

  const items = await ManagerNotification.find(query).sort({ createdAt: -1 }).limit(300)
  return res.status(200).json({ success: true, data: items.map(serialize) })
})

export const markManagerNotificationRead = asyncHandler(async (req, res) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const item = await ManagerNotification.findOne({ _id: req.params.notificationId, companyId, managerId, isDeleted: false })
  if (!item) return res.status(404).json({ success: false, message: 'Notification not found' })
  item.isRead = true
  item.readAt = new Date().toISOString()
  await item.save()
  return res.status(200).json({ success: true, message: 'Notification marked as read', data: serialize(item) })
})

export const markAllManagerNotificationsRead = asyncHandler(async (req, res) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const now = new Date().toISOString()
  await ManagerNotification.updateMany(
    { companyId, managerId, isDeleted: false, isRead: false },
    { isRead: true, readAt: now }
  )
  return res.status(200).json({ success: true, message: 'All notifications marked as read' })
})

export const deleteManagerNotification = asyncHandler(async (req, res) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const item = await ManagerNotification.findOne({ _id: req.params.notificationId, companyId, managerId, isDeleted: false })
  if (!item) return res.status(404).json({ success: false, message: 'Notification not found' })
  item.isDeleted = true
  item.deletedAt = new Date().toISOString()
  await item.save()
  return res.status(200).json({ success: true, message: 'Notification deleted successfully' })
})
