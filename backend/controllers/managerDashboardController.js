import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import PerformanceReview from '../models/PerformanceReview.js'
import ActivityLog from '../models/ActivityLog.js'
import Task from '../models/Task.js'

const normalizeDateKey = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const toNum = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toTaskView = (item, employeeNameMap) => ({
  id: item._id,
  title: item.title || 'Untitled Task',
  employeeId: item.employeeId || null,
  employeeName: employeeNameMap[String(item.employeeId || '')] || '-',
  status: String(item.status || 'active').toLowerCase(),
  priority: String(item.priority || 'medium').toLowerCase(),
  dueDate: item.dueDate || null,
  createdAt: item.createdAt || null
})

const buildManagerScope = async (req) => {
  const managerId = String(req.user.id)
  const companyId = String(req.user.companyId)

  const teamMembers = await User.find({
    companyId,
    role: 'employee',
    managerId
  }).select('_id name email departmentId employeeId')

  const teamIds = teamMembers.map((item) => String(item._id))
  const attendanceEmployeeKeys = teamMembers.flatMap((item) => {
    const keys = [String(item._id)]
    if (item.employeeId) keys.push(String(item.employeeId))
    return keys
  })

  const employeeNameMap = Object.fromEntries(
    teamMembers.map((item) => [String(item._id), item.name || '-'])
  )
  for (const member of teamMembers) {
    if (member.employeeId) employeeNameMap[String(member.employeeId)] = member.name || '-'
  }

  return { managerId, companyId, teamMembers, teamIds, attendanceEmployeeKeys, employeeNameMap }
}

export const getManagerDashboard = asyncHandler(async (req, res) => {
  const { managerId, companyId, teamMembers, teamIds, attendanceEmployeeKeys, employeeNameMap } = await buildManagerScope(req)
  const todayKey = normalizeDateKey(new Date())

  if (teamIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        cards: {
          totalTeamMembers: 0,
          presentToday: 0,
          absentToday: 0,
          pendingLeaveRequests: 0,
          activeTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          averageTeamPerformance: 0
        },
        pendingLeaveRequestsPreview: [],
        todayAttendancePreview: [],
        taskStatusChart: [],
        teamPerformanceSummary: [],
        quickActions: [
          { label: 'View Team', path: '/manager/team' },
          { label: 'View Attendance', path: '/manager/attendance' },
          { label: 'View Pending Leaves', path: '/manager/leaves' },
          { label: 'View Tasks', path: '/manager/tasks' },
          { label: 'Assign Task', path: '/manager/tasks?create=true' },
          { label: 'Add Review', path: '/manager/performance' }
        ],
        recentActivities: []
      }
    })
  }

  const [todayAttendanceRows, pendingLeaveRows, taskRows, performanceRows, recentActivities] = await Promise.all([
    Attendance.find({ companyId, employeeId: { $in: attendanceEmployeeKeys } }).select('_id employeeId status checkIn checkOut date createdAt'),
    Leave.find({ companyId, employeeId: { $in: attendanceEmployeeKeys }, status: 'pending' })
      .sort({ createdAt: -1 })
      .select('_id employeeId leaveType startDate endDate status createdAt'),
    Task.find({ companyId, employeeId: { $in: teamIds } })
      .sort({ createdAt: -1 })
      .select('_id employeeId title status priority dueDate createdAt'),
    PerformanceReview.find({ companyId, employeeId: { $in: teamIds }, archived: false })
      .sort({ createdAt: -1 })
      .select('_id employeeId selfScore managerScore finalScore status cycle reviewDate updatedAt'),
    ActivityLog.find({
      companyId,
      $or: [
        { userId: managerId },
        { userId: { $in: teamIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id module action message userId createdAt')
  ])

  const todayAttendanceByEmployee = new Map()
  for (const row of todayAttendanceRows) {
    const rowDateKey = normalizeDateKey(row.date || row.createdAt)
    if (rowDateKey !== todayKey) continue

    const empKey = String(row.employeeId || '')
    const existing = todayAttendanceByEmployee.get(empKey)
    if (!existing || String(existing.createdAt || '') < String(row.createdAt || '')) {
      todayAttendanceByEmployee.set(empKey, row)
    }
  }

  let presentToday = 0
  let absentToday = 0
  const todayAttendancePreview = teamMembers.map((member) => {
    const employeeKeys = [String(member._id)]
    if (member.employeeId) employeeKeys.push(String(member.employeeId))
    const match = employeeKeys.map((key) => todayAttendanceByEmployee.get(key)).find(Boolean)
    const status = String(match?.status || 'absent').toLowerCase()
    if (status === 'present') presentToday += 1
    else absentToday += 1

    return {
      id: String(member._id),
      employeeId: member.employeeId || member._id,
      employeeName: member.name || '-',
      status,
      checkIn: match?.checkIn || null,
      checkOut: match?.checkOut || null
    }
  })

  const now = Date.now()
  const mappedTasks = taskRows.map((item) => toTaskView(item, employeeNameMap))
  const completedTasks = mappedTasks.filter((item) => item.status === 'completed').length
  const activeTasks = mappedTasks.filter((item) => item.status !== 'completed').length
  const overdueTasks = mappedTasks.filter((item) => {
    if (item.status === 'completed' || !item.dueDate) return false
    const due = new Date(item.dueDate).getTime()
    return Number.isFinite(due) && due < now
  }).length

  const taskStatusCounts = mappedTasks.reduce((acc, item) => {
    const key = item.status || 'active'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const taskStatusChart = Object.entries(taskStatusCounts).map(([status, count]) => ({ status, count }))

  const scoreByEmployee = teamIds.reduce((acc, id) => {
    acc[id] = { total: 0, count: 0 }
    return acc
  }, {})

  for (const row of performanceRows) {
    const employeeId = String(row.employeeId || '')
    if (!scoreByEmployee[employeeId]) continue
    const score = row.finalScore ?? row.managerScore ?? row.selfScore ?? 0
    scoreByEmployee[employeeId].total += toNum(score)
    scoreByEmployee[employeeId].count += 1
  }

  const teamPerformanceSummary = teamMembers.map((member) => {
    const key = String(member._id)
    const score = scoreByEmployee[key]
    const averageScore = score?.count ? Number((score.total / score.count).toFixed(2)) : 0
    return {
      employeeId: member.employeeId || member._id,
      employeeName: member.name || '-',
      averageScore,
      reviews: score?.count || 0
    }
  })

  const averageTeamPerformance = teamPerformanceSummary.length
    ? Number((teamPerformanceSummary.reduce((sum, item) => sum + item.averageScore, 0) / teamPerformanceSummary.length).toFixed(2))
    : 0

  const pendingLeaveRequestsPreview = pendingLeaveRows.slice(0, 8).map((item) => ({
    id: item._id,
    employeeId: item.employeeId || null,
    employeeName: employeeNameMap[String(item.employeeId || '')] || '-',
    leaveType: item.leaveType || 'leave',
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    status: item.status || 'pending',
    createdAt: item.createdAt || null
  }))

  return res.status(200).json({
    success: true,
    data: {
      cards: {
        totalTeamMembers: teamMembers.length,
        presentToday,
        absentToday,
        pendingLeaveRequests: pendingLeaveRows.length,
        activeTasks,
        completedTasks,
        overdueTasks,
        averageTeamPerformance
      },
      pendingLeaveRequestsPreview,
      todayAttendancePreview,
      taskStatusChart,
      teamPerformanceSummary,
      quickActions: [
        { label: 'View Team', path: '/manager/team' },
        { label: 'View Attendance', path: '/manager/attendance' },
        { label: 'View Pending Leaves', path: '/manager/leaves' },
        { label: 'View Tasks', path: '/manager/tasks' },
        { label: 'Assign Task', path: '/manager/tasks?create=true' },
        { label: 'Add Review', path: '/manager/performance' }
      ],
      recentActivities: recentActivities.map((item) => ({
        id: item._id,
        module: item.module || '-',
        action: item.action || '-',
        message: item.message || '-',
        userId: item.userId || null,
        createdAt: item.createdAt || null
      }))
    }
  })
})

export const getManagerRecentActivities = asyncHandler(async (req, res) => {
  const { managerId, companyId, teamIds } = await buildManagerScope(req)

  const items = await ActivityLog.find({
    companyId,
    $or: [
      { userId: managerId },
      { userId: { $in: teamIds } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('_id module action message userId createdAt')

  return res.status(200).json({
    success: true,
    data: items.map((item) => ({
      id: item._id,
      module: item.module || '-',
      action: item.action || '-',
      message: item.message || '-',
      userId: item.userId || null,
      createdAt: item.createdAt || null
    }))
  })
})
