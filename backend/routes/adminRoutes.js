import { Router } from 'express'
import generateToken from '../utils/generateToken.js'
import { protectAdmin } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { requireCompanyScope } from '../middleware/companyMiddleware.js'
import { getAdminDashboard } from '../controllers/adminDashboardController.js'
import { listHR, createHR, getHRById, updateHR, deleteHR, updateHRStatus } from '../controllers/adminHRController.js'
import {
  listManagers,
  createManager,
  getManagerById,
  updateManager,
  deleteManager,
  updateManagerStatus,
  assignEmployeesToManager
} from '../controllers/adminManagerController.js'
import {
  listEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
} from '../controllers/adminEmployeeController.js'
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees
} from '../controllers/adminDepartmentController.js'
import {
  listAttendance,
  getTodayAttendance,
  getMonthlyAttendance,
  markManualAttendance,
  updateAttendance,
  exportAttendance,
  deleteAttendance
} from '../controllers/adminAttendanceController.js'
import {
  listLeaves,
  getLeaveById,
  createLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  setLeavePolicy,
  getLeavePolicy,
  updateLeave,
  deleteLeave
} from '../controllers/adminLeaveController.js'
import {
  generatePayroll,
  listPayroll,
  getPayrollById,
  updatePayroll,
  getPayrollByEmployee,
  getPayslip,
  createPayroll,
  deletePayroll
} from '../controllers/adminPayrollController.js'
import {
  getAdminReports,
  getEmployeeReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getDepartmentReport,
  getSummaryReport
} from '../controllers/adminReportController.js'
import {
  getSettings,
  updateSettings,
  adminLogin,
  updateCompanyProfile,
  updateOfficeTiming,
  updateWorkingDays,
  updateAttendanceRules,
  updateLeavePolicySettings,
  updatePayrollSettings,
  addHoliday,
  deleteHoliday
} from '../controllers/adminSettingsController.js'

const router = Router()

router.post('/auth/login', adminLogin)

router.use(protectAdmin, requireRole('admin'), requireCompanyScope)

router.get('/auth/me', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin profile fetched successfully',
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      companyId: req.user.companyId,
      status: req.user.status
    }
  })
})

router.post('/auth/refresh-token', (req, res) => {
  const token = generateToken({ id: req.user.id, role: 'admin', companyId: req.user.companyId })
  return res.status(200).json({ success: true, message: 'Token refreshed successfully', data: { token } })
})

router.get('/dashboard', getAdminDashboard)

router.get('/hr', listHR)
router.post('/hr', createHR)
router.get('/hr/:id', getHRById)
router.put('/hr/:id', updateHR)
router.delete('/hr/:id', deleteHR)
router.patch('/hr/:id/status', updateHRStatus)

router.get('/managers', listManagers)
router.post('/managers', createManager)
router.get('/managers/:id', getManagerById)
router.put('/managers/:id', updateManager)
router.delete('/managers/:id', deleteManager)
router.patch('/managers/:id/status', updateManagerStatus)
router.patch('/managers/:id/assign-employees', assignEmployeesToManager)

router.get('/employees', listEmployees)
router.post('/employees', createEmployee)
router.get('/employees/:id', getEmployeeById)
router.put('/employees/:id', updateEmployee)
router.delete('/employees/:id', deleteEmployee)
router.patch('/employees/:id/status', updateEmployeeStatus)

router.get('/departments', listDepartments)
router.post('/departments', createDepartment)
router.get('/departments/:id', getDepartmentById)
router.put('/departments/:id', updateDepartment)
router.delete('/departments/:id', deleteDepartment)
router.get('/departments/:id/employees', getDepartmentEmployees)

router.get('/attendance', listAttendance)
router.get('/attendance/today', getTodayAttendance)
router.get('/attendance/monthly', getMonthlyAttendance)
router.get('/attendance/export', exportAttendance)
router.post('/attendance/manual', markManualAttendance)
router.post('/attendance', markManualAttendance)
router.put('/attendance/:id', updateAttendance)
router.delete('/attendance/:id', deleteAttendance)

router.get('/leaves', listLeaves)
router.post('/leaves', createLeave)
router.get('/leaves/policy', getLeavePolicy)
router.post('/leaves/policy', setLeavePolicy)
router.get('/leaves/balance/:employeeId', getLeaveBalance)
router.get('/leaves/:id', getLeaveById)
router.patch('/leaves/:id/approve', approveLeave)
router.patch('/leaves/:id/reject', rejectLeave)
router.put('/leaves/:id', updateLeave)
router.delete('/leaves/:id', deleteLeave)

router.get('/payroll', listPayroll)
router.post('/payroll/generate', generatePayroll)
router.post('/payroll', createPayroll)
router.get('/payroll/employee/:employeeId', getPayrollByEmployee)
router.get('/payroll/:id/payslip', getPayslip)
router.get('/payroll/:id', getPayrollById)
router.put('/payroll/:id', updatePayroll)
router.delete('/payroll/:id', deletePayroll)

router.get('/reports', getAdminReports)
router.get('/reports/employees', getEmployeeReport)
router.get('/reports/attendance', getAttendanceReport)
router.get('/reports/leaves', getLeaveReport)
router.get('/reports/payroll', getPayrollReport)
router.get('/reports/departments', getDepartmentReport)
router.get('/reports/summary', getSummaryReport)

router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.put('/settings/company-profile', updateCompanyProfile)
router.put('/settings/office-timing', updateOfficeTiming)
router.put('/settings/working-days', updateWorkingDays)
router.put('/settings/attendance-rules', updateAttendanceRules)
router.put('/settings/leave-policy', updateLeavePolicySettings)
router.put('/settings/payroll', updatePayrollSettings)
router.post('/settings/holidays', addHoliday)
router.delete('/settings/holidays/:id', deleteHoliday)

export default router
