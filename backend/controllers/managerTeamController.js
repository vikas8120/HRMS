import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import Department from '../models/Department.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Task from '../models/Task.js'
import PerformanceReview from '../models/PerformanceReview.js'
import EmployeeDocument from '../models/EmployeeDocument.js'

const normalizeDateKey = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const toEmployeePayload = (employee, departmentName, todayAttendanceStatus) => ({
  id: employee._id,
  employeeId: employee.employeeId || employee._id,
  profileImage: employee.profileImage || employee.avatar || '',
  name: employee.name || '-',
  email: employee.email || '-',
  phone: employee.phone || '-',
  departmentId: employee.departmentId || null,
  department: departmentName || '-',
  designation: employee.designation || '-',
  status: employee.status || 'inactive',
  joiningDate: employee.joiningDate || null,
  todayAttendanceStatus: todayAttendanceStatus || 'absent'
})

const resolveTodayAttendanceMap = async (companyId, employees) => {
  const todayKey = normalizeDateKey(new Date())
  const keyToEmployeeId = new Map()
  const lookupKeys = []

  for (const employee of employees) {
    const idKey = String(employee._id)
    lookupKeys.push(idKey)
    keyToEmployeeId.set(idKey, idKey)
    if (employee.employeeId) {
      const empKey = String(employee.employeeId)
      lookupKeys.push(empKey)
      keyToEmployeeId.set(empKey, idKey)
    }
  }

  const rows = await Attendance.find({
    companyId,
    employeeId: { $in: lookupKeys }
  }).select('_id employeeId status createdAt date')

  const latestByEmployee = new Map()
  for (const row of rows) {
    const rowDate = normalizeDateKey(row.date || row.createdAt)
    if (rowDate !== todayKey) continue
    const ownerId = keyToEmployeeId.get(String(row.employeeId || ''))
    if (!ownerId) continue
    const existing = latestByEmployee.get(ownerId)
    if (!existing || String(existing.createdAt || '') < String(row.createdAt || '')) {
      latestByEmployee.set(ownerId, row)
    }
  }

  const statusMap = new Map()
  for (const employee of employees) {
    const row = latestByEmployee.get(String(employee._id))
    statusMap.set(String(employee._id), String(row?.status || 'absent').toLowerCase())
  }

  return statusMap
}

export const getManagerTeam = asyncHandler(async (req, res) => {
  const managerId = String(req.user.id)
  const companyId = String(req.user.companyId)
  const search = String(req.query.search || '').trim().toLowerCase()
  const department = String(req.query.department || 'all').trim()
  const designation = String(req.query.designation || 'all').trim()
  const status = String(req.query.status || 'all').trim().toLowerCase()
  const attendanceStatus = String(req.query.attendanceStatus || 'all').trim().toLowerCase()

  const employees = await User.find({
    companyId,
    role: 'employee',
    managerId
  }).select('_id employeeId profileImage avatar name email phone departmentId designation status joiningDate')

  const departmentIds = [...new Set(employees.map((item) => String(item.departmentId || '')).filter(Boolean))]
  const departments = departmentIds.length
    ? await Department.find({ companyId, _id: { $in: departmentIds } }).select('_id name')
    : []
  const departmentMap = Object.fromEntries(departments.map((item) => [String(item._id), item.name || '-']))
  const todayAttendanceMap = await resolveTodayAttendanceMap(companyId, employees)

  let scoped = employees.map((employee) =>
    toEmployeePayload(
      employee,
      departmentMap[String(employee.departmentId || '')] || '-',
      todayAttendanceMap.get(String(employee._id)) || 'absent'
    )
  )

  if (search) {
    scoped = scoped.filter((item) => (
      String(item.name || '').toLowerCase().includes(search)
      || String(item.email || '').toLowerCase().includes(search)
      || String(item.phone || '').toLowerCase().includes(search)
    ))
  }

  if (department !== 'all') {
    scoped = scoped.filter((item) => String(item.departmentId || '') === department)
  }

  if (designation !== 'all') {
    scoped = scoped.filter((item) => String(item.designation || '').toLowerCase() === designation.toLowerCase())
  }

  if (status !== 'all') {
    scoped = scoped.filter((item) => String(item.status || '').toLowerCase() === status)
  }

  if (attendanceStatus !== 'all') {
    scoped = scoped.filter((item) => String(item.todayAttendanceStatus || '').toLowerCase() === attendanceStatus)
  }

  const designationOptions = [...new Set(
    employees.map((item) => String(item.designation || '').trim()).filter(Boolean)
  )]

  return res.status(200).json({
    success: true,
    data: scoped,
    filters: {
      departments: departments.map((item) => ({ id: item._id, name: item.name || '-' })),
      designations: designationOptions
    }
  })
})

export const getManagerTeamMemberById = asyncHandler(async (req, res) => {
  const managerId = String(req.user.id)
  const companyId = String(req.user.companyId)
  const employeeIdParam = String(req.params.employeeId || '').trim()

  const employee = await User.findOne({
    companyId,
    role: 'employee',
    managerId,
    $or: [{ _id: employeeIdParam }, { employeeId: employeeIdParam }]
  }).select('_id employeeId profileImage avatar name email phone departmentId designation status joiningDate createdAt')

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found in your team' })
  }

  const department = employee.departmentId
    ? await Department.findOne({ companyId, _id: employee.departmentId }).select('_id name')
    : null
  const attendanceMap = await resolveTodayAttendanceMap(companyId, [employee])
  const todayAttendanceStatus = attendanceMap.get(String(employee._id)) || 'absent'

  const attendanceHistory = await Attendance.find({
    companyId,
    employeeId: { $in: [String(employee._id), String(employee.employeeId || '')].filter(Boolean) }
  }).sort({ createdAt: -1 }).limit(20).select('_id status checkIn checkOut createdAt date')

  const leaveHistory = await Leave.find({
    companyId,
    employeeId: { $in: [String(employee._id), String(employee.employeeId || '')].filter(Boolean) }
  }).sort({ createdAt: -1 }).limit(20).select('_id leaveType startDate endDate status reason createdAt')

  const tasks = await Task.find({
    companyId,
    employeeId: String(employee._id)
  }).sort({ createdAt: -1 }).limit(20).select('_id title status priority dueDate createdAt')

  const performance = await PerformanceReview.find({
    companyId,
    employeeId: String(employee._id),
    archived: false
  }).sort({ createdAt: -1 }).limit(20).select('_id cycle selfScore managerScore finalScore status reviewDate updatedAt')

  return res.status(200).json({
    success: true,
    data: {
      employee: toEmployeePayload(
        employee,
        department?.name || '-',
        todayAttendanceStatus
      ),
      attendanceHistory: attendanceHistory.map((item) => ({
        id: item._id,
        status: item.status || 'absent',
        checkIn: item.checkIn || null,
        checkOut: item.checkOut || null,
        date: item.date || item.createdAt || null
      })),
      leaveHistory: leaveHistory.map((item) => ({
        id: item._id,
        leaveType: item.leaveType || '-',
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        status: item.status || 'pending',
        reason: item.reason || '',
        createdAt: item.createdAt || null
      })),
      tasks: tasks.map((item) => ({
        id: item._id,
        title: item.title || '-',
        status: item.status || 'active',
        priority: item.priority || 'medium',
        dueDate: item.dueDate || null,
        createdAt: item.createdAt || null
      })),
      performance: performance.map((item) => ({
        id: item._id,
        cycle: item.cycle || '-',
        selfScore: item.selfScore ?? 0,
        managerScore: item.managerScore ?? 0,
        finalScore: item.finalScore ?? 0,
        status: item.status || 'draft',
        reviewDate: item.reviewDate || null,
        updatedAt: item.updatedAt || null
      }))
    }
  })
})

export const getManagerTeamMemberDetails = asyncHandler(async (req, res) => {
  const managerId = String(req.user.id)
  const companyId = String(req.user.companyId)
  const employeeIdParam = String(req.params.employeeId || '').trim()

  const [managerUser, employee] = await Promise.all([
    User.findOne({ _id: managerId, companyId, role: 'manager' }).select('_id role permissions canViewDocuments'),
    User.findOne({
      companyId,
      role: 'employee',
      managerId,
      $or: [{ _id: employeeIdParam }, { employeeId: employeeIdParam }]
    }).select('_id employeeId profileImage avatar name email phone departmentId designation status joiningDate createdAt')
  ])

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found in your team' })
  }

  const canViewDocuments = Boolean(
    managerUser?.canViewDocuments
    || managerUser?.permissions?.documents?.view
    || managerUser?.permissions?.employeeDocuments?.view
  )

  const department = employee.departmentId
    ? await Department.findOne({ companyId, _id: employee.departmentId }).select('_id name')
    : null
  const attendanceMap = await resolveTodayAttendanceMap(companyId, [employee])
  const todayAttendanceStatus = attendanceMap.get(String(employee._id)) || 'absent'
  const employeeKeys = [String(employee._id), String(employee.employeeId || '')].filter(Boolean)

  const [attendanceHistory, leaveHistory, tasks, performance, documents] = await Promise.all([
    Attendance.find({ companyId, employeeId: { $in: employeeKeys } }).sort({ createdAt: -1 }).limit(30).select('_id status checkIn checkOut createdAt date'),
    Leave.find({ companyId, employeeId: { $in: employeeKeys } }).sort({ createdAt: -1 }).limit(30).select('_id leaveType startDate endDate status reason createdAt'),
    Task.find({ companyId, employeeId: String(employee._id) }).sort({ createdAt: -1 }).limit(30).select('_id title status priority dueDate createdAt completedAt'),
    PerformanceReview.find({ companyId, employeeId: String(employee._id), archived: false }).sort({ createdAt: -1 }).limit(30).select('_id cycle selfScore managerScore finalScore status reviewDate updatedAt'),
    canViewDocuments
      ? EmployeeDocument.find({ companyId, employeeId: String(employee._id), archived: false }).sort({ createdAt: -1 }).limit(12).select('_id title category fileUrl status verified expiryDate createdAt')
      : Promise.resolve([])
  ])

  const presentCount = attendanceHistory.filter((x) => String(x.status || '').toLowerCase() === 'present').length
  const absentCount = attendanceHistory.filter((x) => String(x.status || '').toLowerCase() === 'absent').length
  const pendingLeaves = leaveHistory.filter((x) => String(x.status || '').toLowerCase() === 'pending').length
  const approvedLeaves = leaveHistory.filter((x) => String(x.status || '').toLowerCase() === 'approved').length
  const activeTasks = tasks.filter((x) => String(x.status || '').toLowerCase() !== 'completed').length
  const completedTasks = tasks.filter((x) => String(x.status || '').toLowerCase() === 'completed').length
  const overdueTasks = tasks.filter((x) => {
    const status = String(x.status || '').toLowerCase()
    if (status === 'completed' || !x.dueDate) return false
    const due = new Date(x.dueDate).getTime()
    return Number.isFinite(due) && due < Date.now()
  }).length

  const avgScore = performance.length
    ? Number((performance.reduce((sum, row) => sum + Number(row.finalScore ?? row.managerScore ?? row.selfScore ?? 0), 0) / performance.length).toFixed(2))
    : 0

  return res.status(200).json({
    success: true,
    data: {
      employee: toEmployeePayload(
        employee,
        department?.name || '-',
        todayAttendanceStatus
      ),
      personalDetails: {
        name: employee.name || '-',
        email: employee.email || '-',
        phone: employee.phone || '-',
        status: employee.status || 'inactive'
      },
      jobDetails: {
        employeeId: employee.employeeId || employee._id,
        department: department?.name || '-',
        designation: employee.designation || '-',
        joiningDate: employee.joiningDate || null,
        managerId
      },
      attendanceSummary: {
        totalRecords: attendanceHistory.length,
        presentCount,
        absentCount,
        todayStatus: todayAttendanceStatus
      },
      leaveSummary: {
        totalRecords: leaveHistory.length,
        pending: pendingLeaves,
        approved: approvedLeaves
      },
      taskSummary: {
        total: tasks.length,
        active: activeTasks,
        completed: completedTasks,
        overdue: overdueTasks
      },
      performanceSummary: {
        totalReviews: performance.length,
        averageScore: avgScore
      },
      attendanceHistory: attendanceHistory.map((item) => ({
        id: item._id,
        status: item.status || 'absent',
        checkIn: item.checkIn || null,
        checkOut: item.checkOut || null,
        date: item.date || item.createdAt || null
      })),
      leaveHistory: leaveHistory.map((item) => ({
        id: item._id,
        leaveType: item.leaveType || '-',
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        status: item.status || 'pending',
        reason: item.reason || '',
        createdAt: item.createdAt || null
      })),
      tasks: tasks.map((item) => ({
        id: item._id,
        title: item.title || '-',
        status: item.status || 'active',
        priority: item.priority || 'medium',
        dueDate: item.dueDate || null,
        createdAt: item.createdAt || null
      })),
      performance: performance.map((item) => ({
        id: item._id,
        cycle: item.cycle || '-',
        selfScore: item.selfScore ?? 0,
        managerScore: item.managerScore ?? 0,
        finalScore: item.finalScore ?? 0,
        status: item.status || 'draft',
        reviewDate: item.reviewDate || null,
        updatedAt: item.updatedAt || null
      })),
      documents: documents.map((item) => ({
        id: item._id,
        title: item.title || '-',
        category: item.category || 'other',
        fileUrl: item.fileUrl || '',
        status: item.status || 'active',
        verified: Boolean(item.verified),
        expiryDate: item.expiryDate || null,
        createdAt: item.createdAt || null
      })),
      permissions: {
        canViewDocuments
      }
    }
  })
})
