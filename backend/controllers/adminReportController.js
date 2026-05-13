import asyncHandler from '../utils/asyncHandler.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import Department from '../models/Department.js'
import User from '../models/User.js'

const toDateKey = (value) => String(value || '').slice(0, 10)

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getEmployeeScope = async (companyId, employeeId, departmentId) => {
  const query = { companyId, role: 'employee' }
  const normalizedEmployeeId = String(employeeId || '').trim()
  const normalizedDepartmentId = String(departmentId || '').trim()

  if (normalizedDepartmentId && normalizedDepartmentId !== 'all') {
    query.departmentId = normalizedDepartmentId
  }

  if (normalizedEmployeeId && normalizedEmployeeId !== 'all') {
    query.$or = [{ _id: normalizedEmployeeId }, { employeeId: normalizedEmployeeId }]
  }

  const employees = await User.find(query).select('_id employeeId name email phone status designation salary departmentId managerId hrId joiningDate createdAt')
  const ids = employees.map((employee) => String(employee.employeeId || employee._id))
  const map = Object.fromEntries(
    employees.map((employee) => [String(employee.employeeId || employee._id), employee])
  )

  return { employees, employeeIds: ids, employeeMap: map }
}

const withDateRange = (rows, from, to, accessor) => rows.filter((row) => {
  const key = toDateKey(accessor(row))
  if (!key) return false
  if (from && key < from) return false
  if (to && key > to) return false
  return true
})

const buildFilterMeta = (req) => ({
  dateFrom: String(req.query.dateFrom || '').trim() || null,
  dateTo: String(req.query.dateTo || '').trim() || null,
  departmentId: String(req.query.departmentId || '').trim() || null,
  employeeId: String(req.query.employeeId || '').trim() || null,
  status: String(req.query.status || '').trim().toLowerCase() || null
})

export const getEmployeeReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)

  const { employees } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)
  const filtered = withDateRange(employees, filters.dateFrom, filters.dateTo, (item) => item.joiningDate || item.createdAt)
  const statusFiltered = filters.status && filters.status !== 'all'
    ? filtered.filter((item) => String(item.status || '').toLowerCase() === filters.status)
    : filtered

  const data = statusFiltered.map((item) => ({
    id: item._id,
    employeeId: item.employeeId || null,
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    status: item.status || 'active',
    designation: item.designation || '',
    salary: asNumber(item.salary),
    departmentId: item.departmentId || null,
    managerId: item.managerId || null,
    hrId: item.hrId || null,
    joiningDate: item.joiningDate || null,
    createdAt: item.createdAt || null
  }))

  return res.status(200).json({
    success: true,
    message: 'Employee report fetched successfully',
    data: {
      companyId,
      reportType: 'employees',
      filters,
      total: data.length,
      records: data
    },
    items: data
  })
})

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)
  const { employeeIds } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)

  const query = { companyId }
  if (employeeIds.length) query.employeeId = { $in: employeeIds }
  else query.employeeId = '__none__'

  const items = await Attendance.find(query).sort({ date: -1, createdAt: -1 })
  const filtered = withDateRange(items, filters.dateFrom, filters.dateTo, (item) => item.date || item.createdAt)
  const statusFiltered = filters.status && filters.status !== 'all'
    ? filtered.filter((item) => String(item.status || '').toLowerCase() === filters.status)
    : filtered

  const summary = {
    total: statusFiltered.length,
    present: statusFiltered.filter((item) => item.status === 'present').length,
    absent: statusFiltered.filter((item) => item.status === 'absent').length,
    halfDay: statusFiltered.filter((item) => item.status === 'half-day').length,
    late: statusFiltered.filter((item) => item.status === 'late').length,
    leave: statusFiltered.filter((item) => item.status === 'leave').length
  }

  const records = statusFiltered.map((item) => ({
    id: item._id,
    employeeId: item.employeeId || item.userId || null,
    date: item.date || null,
    checkIn: item.checkIn || null,
    checkOut: item.checkOut || null,
    workingHours: asNumber(item.workingHours),
    status: item.status || 'present',
    markedBy: item.markedBy || null,
    createdAt: item.createdAt || null
  }))

  return res.status(200).json({
    success: true,
    message: 'Attendance report fetched successfully',
    data: {
      companyId,
      reportType: 'attendance',
      filters,
      summary,
      total: records.length,
      records
    },
    items: records
  })
})

export const getLeaveReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)
  const { employeeIds } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)

  const query = { companyId }
  if (employeeIds.length) query.employeeId = { $in: employeeIds }
  else query.employeeId = '__none__'

  const items = await Leave.find(query).sort({ createdAt: -1 })
  const filtered = withDateRange(items, filters.dateFrom, filters.dateTo, (item) => item.startDate || item.createdAt)
  const statusFiltered = filters.status && filters.status !== 'all'
    ? filtered.filter((item) => String(item.status || '').toLowerCase() === filters.status)
    : filtered

  const summary = {
    total: statusFiltered.length,
    pending: statusFiltered.filter((item) => item.status === 'pending').length,
    approved: statusFiltered.filter((item) => item.status === 'approved').length,
    rejected: statusFiltered.filter((item) => item.status === 'rejected').length,
    totalDays: statusFiltered.reduce((acc, item) => acc + asNumber(item.totalDays), 0)
  }

  const records = statusFiltered.map((item) => ({
    id: item._id,
    employeeId: item.employeeId || null,
    leaveType: item.leaveType || 'casual',
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    totalDays: asNumber(item.totalDays),
    reason: item.reason || '',
    status: item.status || 'pending',
    approvedBy: item.approvedBy || null,
    rejectionReason: item.rejectionReason || '',
    createdAt: item.createdAt || null
  }))

  return res.status(200).json({
    success: true,
    message: 'Leave report fetched successfully',
    data: {
      companyId,
      reportType: 'leaves',
      filters,
      summary,
      total: records.length,
      records
    },
    items: records
  })
})

export const getPayrollReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)
  const { employeeIds } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)

  const query = { companyId }
  if (employeeIds.length) query.employeeId = { $in: employeeIds }
  else query.employeeId = '__none__'

  const items = await Payroll.find(query).sort({ year: -1, month: -1, createdAt: -1 })
  const filtered = withDateRange(items, filters.dateFrom, filters.dateTo, (item) => item.createdAt)
  const statusFiltered = filters.status && filters.status !== 'all'
    ? filtered.filter((item) => String(item.status || '').toLowerCase() === filters.status)
    : filtered

  const summary = {
    total: statusFiltered.length,
    generated: statusFiltered.filter((item) => item.status === 'generated').length,
    paid: statusFiltered.filter((item) => item.status === 'paid').length,
    pending: statusFiltered.filter((item) => item.status === 'pending').length,
    grossPayout: statusFiltered.reduce((acc, item) => acc + asNumber(item.netSalary), 0)
  }

  const records = statusFiltered.map((item) => ({
    id: item._id,
    employeeId: item.employeeId || null,
    month: item.month || '',
    year: asNumber(item.year),
    basicSalary: asNumber(item.basicSalary),
    hra: asNumber(item.hra),
    allowances: asNumber(item.allowances),
    bonus: asNumber(item.bonus),
    deductions: asNumber(item.deductions),
    tax: asNumber(item.tax),
    netSalary: asNumber(item.netSalary),
    status: item.status || 'generated',
    generatedBy: item.generatedBy || null,
    createdAt: item.createdAt || null
  }))

  return res.status(200).json({
    success: true,
    message: 'Payroll report fetched successfully',
    data: {
      companyId,
      reportType: 'payroll',
      filters,
      summary,
      total: records.length,
      records
    },
    items: records
  })
})

export const getDepartmentReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)

  const departmentQuery = { companyId }
  if (filters.departmentId && filters.departmentId !== 'all') departmentQuery._id = filters.departmentId
  const departments = await Department.find(departmentQuery).sort({ createdAt: -1 })
  const { employees } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)
  const filteredEmployees = withDateRange(employees, filters.dateFrom, filters.dateTo, (item) => item.joiningDate || item.createdAt)

  const countByDepartment = {}
  for (const employee of filteredEmployees) {
    const key = String(employee.departmentId || '')
    if (!key) continue
    countByDepartment[key] = (countByDepartment[key] || 0) + 1
  }

  const records = departments.map((item) => ({
    id: item._id,
    name: item.name || '',
    description: item.description || '',
    departmentHead: item.departmentHead || null,
    status: item.status || 'active',
    employeeCount: countByDepartment[String(item._id)] || 0,
    createdAt: item.createdAt || null
  }))
  const statusFiltered = filters.status && filters.status !== 'all'
    ? records.filter((item) => String(item.status || '').toLowerCase() === filters.status)
    : records

  return res.status(200).json({
    success: true,
    message: 'Department report fetched successfully',
    data: {
      companyId,
      reportType: 'departments',
      filters,
      total: statusFiltered.length,
      records: statusFiltered
    },
    items: statusFiltered
  })
})

export const getSummaryReport = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId
  const filters = buildFilterMeta(req)
  const { employees, employeeIds } = await getEmployeeScope(companyId, filters.employeeId, filters.departmentId)

  const attendanceQuery = { companyId, employeeId: employeeIds.length ? { $in: employeeIds } : '__none__' }
  const leaveQuery = { companyId, employeeId: employeeIds.length ? { $in: employeeIds } : '__none__' }
  const payrollQuery = { companyId, employeeId: employeeIds.length ? { $in: employeeIds } : '__none__' }

  const [departments, attendanceItems, leaveItems, payrollItems] = await Promise.all([
    Department.countDocuments({ companyId }),
    Attendance.find(attendanceQuery).select('date status'),
    Leave.find(leaveQuery).select('startDate status totalDays'),
    Payroll.find(payrollQuery).select('status netSalary createdAt')
  ])

  const attendanceFiltered = withDateRange(attendanceItems, filters.dateFrom, filters.dateTo, (item) => item.date)
  const leavesFiltered = withDateRange(leaveItems, filters.dateFrom, filters.dateTo, (item) => item.startDate)
  const payrollFiltered = withDateRange(payrollItems, filters.dateFrom, filters.dateTo, (item) => item.createdAt)

  const data = {
    companyId,
    reportType: 'summary',
    filters,
    employees: employees.length,
    managers: await User.countDocuments({ companyId, role: 'manager' }),
    hrUsers: await User.countDocuments({ companyId, role: 'hr' }),
    departments,
    attendance: {
      total: attendanceFiltered.length,
      present: attendanceFiltered.filter((item) => item.status === 'present').length,
      absent: attendanceFiltered.filter((item) => item.status === 'absent').length
    },
    leaves: {
      total: leavesFiltered.length,
      pending: leavesFiltered.filter((item) => item.status === 'pending').length,
      approved: leavesFiltered.filter((item) => item.status === 'approved').length,
      rejected: leavesFiltered.filter((item) => item.status === 'rejected').length
    },
    payroll: {
      total: payrollFiltered.length,
      paid: payrollFiltered.filter((item) => item.status === 'paid').length,
      pending: payrollFiltered.filter((item) => item.status === 'pending').length,
      generated: payrollFiltered.filter((item) => item.status === 'generated').length,
      netPayout: payrollFiltered.reduce((acc, item) => acc + asNumber(item.netSalary), 0)
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Summary report fetched successfully',
    data,
    item: data
  })
})

export const getAdminReports = getSummaryReport
