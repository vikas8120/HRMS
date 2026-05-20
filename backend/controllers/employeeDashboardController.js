import asyncHandler from '../utils/asyncHandler.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import CompanySettings from '../models/CompanySettings.js'
import User from '../models/User.js'
import Announcement from '../models/Announcement.js'

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toIsoDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const employeeUserId = String(req.user?.id || '')
  const companyId = String(req.user?.companyId || '')

  if (!employeeUserId || !companyId) {
    return res.status(401).json({ success: false, message: 'Unauthorized context missing' })
  }

  const now = new Date()
  const today = formatDateKey(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [employee, todayAttendance, monthAttendance, pendingLeavesCount, leavesThisYear, latestPayslip, settings, announcements] = await Promise.all([
    User.findById(employeeUserId).select('name email employeeId companyId'),
    Attendance.findOne({ companyId, userId: employeeUserId, date: today }),
    Attendance.find({ companyId, userId: employeeUserId, date: { $gte: formatDateKey(monthStart), $lte: formatDateKey(monthEnd) } }),
    Leave.countDocuments({ companyId, employeeId: employeeUserId, status: 'pending' }),
    Leave.find({
      companyId,
      employeeId: employeeUserId,
      status: 'approved',
      startDate: { $gte: `${now.getFullYear()}-01-01`, $lte: `${now.getFullYear()}-12-31` }
    }).select('leaveType totalDays'),
    Payroll.findOne({ companyId, employeeId: employeeUserId }).sort({ year: -1, month: -1 }),
    CompanySettings.findOne({ companyId }).select('leavePolicy holidays'),
    Announcement.find({ companyId, status: { $in: ['active', 'published'] } }).sort({ createdAt: -1 }).limit(6)
  ])

  const monthSummary = { present: 0, absent: 0, late: 0, halfDay: 0 }
  for (const record of monthAttendance || []) {
    const status = String(record.status || '').toLowerCase()
    if (status === 'present') monthSummary.present += 1
    else if (status === 'absent') monthSummary.absent += 1
    else if (status === 'late') monthSummary.late += 1
    else if (status === 'half_day' || status === 'halfday') monthSummary.halfDay += 1
  }

  const leavePolicy = settings?.leavePolicy || {}
  const leaveBalance = {
    casual: Number(leavePolicy.casual || 0),
    sick: Number(leavePolicy.sick || 0),
    earned: Number(leavePolicy.earned || 0)
  }

  for (const leave of leavesThisYear || []) {
    const leaveType = String(leave.leaveType || '').toLowerCase()
    const days = Number(leave.totalDays || 0)
    if (leaveType === 'casual') leaveBalance.casual = Math.max(0, leaveBalance.casual - days)
    if (leaveType === 'sick') leaveBalance.sick = Math.max(0, leaveBalance.sick - days)
    if (leaveType === 'earned') leaveBalance.earned = Math.max(0, leaveBalance.earned - days)
  }

  const upcomingHolidays = (settings?.holidays || [])
    .map((holiday) => ({
      name: holiday.name || '-',
      date: toIsoDay(holiday.date),
      type: holiday.type || 'holiday',
      description: holiday.description || ''
    }))
    .filter((holiday) => holiday.date && holiday.date >= today)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 6)

  const notifications = (announcements || []).map((item) => ({
    id: item._id,
    title: item.title || 'Announcement',
    message: item.message || item.description || '',
    priority: item.priority || 'normal',
    createdAt: item.createdAt || item.updatedAt || null
  }))

  return res.status(200).json({
    success: true,
    message: 'Employee dashboard fetched successfully',
    data: {
      employee: {
        id: employee?._id || employeeUserId,
        employeeId: employee?.employeeId || '',
        name: employee?.name || req.user?.name || 'Employee',
        email: employee?.email || req.user?.email || '',
        companyId
      },
      todayAttendanceStatus: {
        date: today,
        status: todayAttendance?.status || 'absent',
        checkIn: todayAttendance?.checkIn || null,
        checkOut: todayAttendance?.checkOut || null,
        workingHours: Number(todayAttendance?.workingHours || 0)
      },
      thisMonthAttendanceSummary: monthSummary,
      leaveBalance,
      pendingLeaveRequests: pendingLeavesCount || 0,
      latestPayslip: latestPayslip
        ? {
            id: latestPayslip._id,
            month: latestPayslip.month,
            year: latestPayslip.year,
            netSalary: latestPayslip.netSalary,
            status: latestPayslip.status
          }
        : null,
      upcomingHolidays,
      notifications
    }
  })
})
