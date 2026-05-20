import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'
import Department from '../models/Department.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import ActivityLog from '../models/ActivityLog.js'
import TenantCompany from '../models/TenantCompany.js'
import CompanySettings from '../models/CompanySettings.js'

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const companyId = req.companyId || req.user.companyId
  const today = new Date()
  const todayDate = today.toISOString().slice(0, 10)
  const currentYear = today.getUTCFullYear()
  const currentMonth = String(today.getUTCMonth() + 1).padStart(2, '0')

  const [
    totalEmployees,
    totalHR,
    totalManagers,
    totalDepartments,
    employees,
    departments,
    attendanceRows,
    leaves,
    payrollRows,
    recentEmployees,
    recentLeaves,
    activityLogs,
    company,
    companySettings
  ] = await Promise.all([
    User.countDocuments({ companyId, role: 'employee' }),
    User.countDocuments({ companyId, role: 'hr' }),
    User.countDocuments({ companyId, role: 'manager' }),
    Department.countDocuments({ companyId }),
    User.find({ companyId, role: 'employee' }).select('_id employeeId name departmentId').sort({ createdAt: -1 }),
    Department.find({ companyId }).select('_id name'),
    Attendance.find({ companyId }).select('userId employeeId date status createdAt'),
    Leave.find({ companyId }).select('employeeId userId leaveType type startDate fromDate endDate toDate status createdAt').sort({ createdAt: -1 }),
    Payroll.find({ companyId }).select('month year netSalary status createdAt').sort({ createdAt: -1 }),
    User.find({ companyId, role: 'employee' }).select('name email departmentId joiningDate createdAt status').sort({ createdAt: -1 }).limit(5),
    Leave.find({ companyId }).select('employeeId userId leaveType type startDate fromDate endDate toDate status createdAt').sort({ createdAt: -1 }).limit(5),
    ActivityLog.find({
      companyId,
      action: { $in: ['employee_added', 'leave_approved', 'payroll_generated', 'department_created'] }
    }).sort({ createdAt: -1 }).limit(10),
    TenantCompany.findById(companyId).select('companyName companyCode plan status industry email phone city state country timezone currency employeeLimit storageLimit'),
    CompanySettings.findOne({ companyId }).select('timezone currency attendancePolicy leavePolicy payrollPolicy companyProfile officeTiming')
  ])

  const employeeNameMap = {}
  for (const emp of employees) {
    employeeNameMap[String(emp._id)] = emp.name || 'Employee'
    if (emp.employeeId) employeeNameMap[String(emp.employeeId)] = emp.name || 'Employee'
  }
  const departmentNameMap = Object.fromEntries(departments.map((dept) => [String(dept._id), dept.name || 'Department']))

  const todayPresentSet = new Set()
  const todayAbsentSet = new Set()
  for (const item of attendanceRows) {
    const rowDate = String(item.date || '').slice(0, 10)
    const status = String(item.status || '').toLowerCase()
    if (rowDate === todayDate && status === 'present' && (item.userId || item.employeeId)) {
      todayPresentSet.add(String(item.userId || item.employeeId))
    }
    if (rowDate === todayDate && status === 'absent' && (item.userId || item.employeeId)) {
      todayAbsentSet.add(String(item.userId || item.employeeId))
    }
  }

  const presentToday = todayPresentSet.size
  const markedAbsentToday = todayAbsentSet.size
  const unresolvedToday = Math.max(totalEmployees - presentToday - markedAbsentToday, 0)
  const absentToday = markedAbsentToday + unresolvedToday

  const pendingLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'pending').length
  const approvedLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'approved').length
  const rejectedLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length

  const monthlyPayroll = payrollRows.reduce((sum, item) => {
    const rowMonth = String(item.month || '').padStart(2, '0')
    const rowYear = Number(item.year || 0)
    const isCurrentMonth = rowMonth === currentMonth && rowYear === currentYear
    if (!isCurrentMonth) return sum
    return sum + Number(item.netSalary || 0)
  }, 0)

  const attendanceChartData = Array.from({ length: 7 }).map((_, index) => {
    const dt = new Date(today)
    dt.setUTCDate(today.getUTCDate() - (6 - index))
    const dateKey = dt.toISOString().slice(0, 10)
    const presentSet = new Set()

    for (const item of attendanceRows) {
      const rowDate = String(item.date || '').slice(0, 10)
      if (rowDate === dateKey && String(item.status || '').toLowerCase() === 'present' && (item.userId || item.employeeId)) {
        presentSet.add(String(item.userId || item.employeeId))
      }
    }

    const present = presentSet.size
    return {
      date: dateKey,
      present,
      absent: Math.max(totalEmployees - present, 0)
    }
  })

  const payrollChartMap = new Map()
  for (let i = 5; i >= 0; i -= 1) {
    const dt = new Date(Date.UTC(currentYear, today.getUTCMonth() - i, 1))
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
    payrollChartMap.set(key, { month: key, total: 0 })
  }

  for (const row of payrollRows) {
    const rowKey = `${Number(row.year || 0)}-${String(row.month || '').padStart(2, '0')}`
    if (!payrollChartMap.has(rowKey)) continue
    const current = payrollChartMap.get(rowKey)
    current.total += Number(row.netSalary || 0)
  }

  const payrollChartData = Array.from(payrollChartMap.values())

  const departmentWiseMap = {}
  for (const emp of employees) {
    const key = emp.departmentId ? String(emp.departmentId) : 'unassigned'
    const name = key === 'unassigned' ? 'Unassigned' : (departmentNameMap[key] || 'Unknown Department')
    if (!departmentWiseMap[name]) departmentWiseMap[name] = 0
    departmentWiseMap[name] += 1
  }
  const departmentWiseEmployees = Object.entries(departmentWiseMap).map(([department, totalEmployeesInDepartment]) => ({
    department,
    totalEmployees: totalEmployeesInDepartment
  }))

  const recentLeaveRequests = recentLeaves.map((item) => ({
    id: item._id,
    employeeName: employeeNameMap[String(item.employeeId || item.userId)] || String(item.employeeId || item.userId || 'Employee'),
    type: item.leaveType || item.type || '',
    fromDate: item.startDate || item.fromDate || null,
    toDate: item.endDate || item.toDate || null,
    status: item.status || '',
    createdAt: item.createdAt || null
  }))

  const recentActivities = activityLogs.map((item) => ({
    id: item._id,
    action: item.action,
    message: item.message,
    module: item.module || '',
    createdAt: item.createdAt || null,
    userId: item.userId || null
  }))

  const payrollPendingCount = payrollRows.filter((item) => String(item.status || '').toLowerCase() !== 'paid').length
  const companyProfileSummary = {
    companyId,
    companyName: company?.companyName || company?.name || '',
    companyCode: company?.companyCode || '',
    plan: company?.plan || '',
    status: company?.status || '',
    industry: company?.industry || '',
    email: company?.email || companySettings?.companyProfile?.email || '',
    phone: company?.phone || companySettings?.companyProfile?.phone || '',
    location: [company?.city, company?.state, company?.country].filter(Boolean).join(', ') || companySettings?.companyProfile?.address || '',
    timezone: companySettings?.timezone || companySettings?.officeTiming?.timezone || company?.timezone || '',
    currency: companySettings?.currency || company?.currency || '',
    employeeLimit: Number(company?.employeeLimit || company?.employeeCount || 0),
    storageLimit: Number(company?.storageLimit || 0)
  }

  const alerts = []
  if (pendingLeaves > 0) alerts.push({ id: 'pending-leaves', severity: 'warning', title: 'Pending leave requests', message: `${pendingLeaves} leave request(s) need review` })
  if (absentToday > 0) alerts.push({ id: 'today-absent', severity: 'info', title: 'Today attendance', message: `${absentToday} employee(s) currently absent or not yet marked present today` })
  if (payrollPendingCount > 0) alerts.push({ id: 'payroll-pending', severity: 'warning', title: 'Payroll follow-up', message: `${payrollPendingCount} payroll record(s) are not marked paid` })
  if (!companySettings) alerts.push({ id: 'settings-missing', severity: 'info', title: 'Company settings', message: 'Complete company settings setup for better compliance tracking' })

  const payload = {
    totalEmployees,
    totalHR,
    totalManagers,
    totalDepartments,
    presentToday,
    absentToday,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    monthlyPayroll,
    todayAttendance: {
      present: presentToday,
      absent: absentToday,
      markedAbsent: markedAbsentToday,
      total: totalEmployees
    },
    recentEmployees,
    recentLeaveRequests,
    attendanceChartData,
    payrollChartData,
    departmentWiseEmployees,
    recentActivities,
    companyProfileSummary,
    alerts
  }

  return res.status(200).json({
    success: true,
    message: 'Dashboard fetched successfully',
    data: payload
  })
})
