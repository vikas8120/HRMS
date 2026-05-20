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
  getMyAttendanceToday,
  enrollAttendanceFace,
  markManualAttendance,
  punchInAttendance,
  punchOutAttendance,
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
import {
  acknowledgeAnnouncement,
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement
} from '../controllers/adminAnnouncementController.js'
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  listDocuments,
  uploadDocumentFileHandler,
  updateDocument,
  verifyDocument
} from '../controllers/adminDocumentController.js'
import {
  archivePerformanceReview,
  createPerformanceReview,
  deletePerformanceReview,
  listPerformanceReviews,
  updatePerformanceReview
} from '../controllers/adminPerformanceController.js'
import {
  archiveRecruitmentCandidate,
  createRecruitmentCandidate,
  deleteRecruitmentCandidate,
  listRecruitmentCandidates,
  updateRecruitmentCandidate
} from '../controllers/adminRecruitmentController.js'
import uploadDocumentFile from '../middleware/uploadMiddleware.js'

const router = Router()

router.post('/auth/login', adminLogin)

router.use(protectAdmin, requireRole('admin', 'hr'), requireCompanyScope)

router.get('/auth/me', (req, res) => {
  const user = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    companyId: req.user.companyId,
    status: req.user.status
  }

  return res.status(200).json({
    success: true,
    message: 'Admin profile fetched successfully',
    user,
    data: user
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
router.get('/attendance/my-today', getMyAttendanceToday)
router.get('/attendance/monthly', getMonthlyAttendance)
router.get('/attendance/export', exportAttendance)
router.post('/attendance/manual', markManualAttendance)
router.post('/attendance', markManualAttendance)
router.post('/attendance/punch-in', punchInAttendance)
router.post('/attendance/punch-out', punchOutAttendance)
router.post('/attendance/face-enroll', enrollAttendanceFace)
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

router.get('/announcements', listAnnouncements)
router.post('/announcements', createAnnouncement)
router.put('/announcements/:id', updateAnnouncement)
router.delete('/announcements/:id', deleteAnnouncement)
router.patch('/announcements/:id/archive', archiveAnnouncement)
router.patch('/announcements/:id/acknowledge', acknowledgeAnnouncement)

router.get('/documents', listDocuments)
router.post('/documents/upload', uploadDocumentFile, uploadDocumentFileHandler)
router.post('/documents', createDocument)
router.put('/documents/:id', updateDocument)
router.delete('/documents/:id', deleteDocument)
router.patch('/documents/:id/archive', archiveDocument)
router.patch('/documents/:id/verify', verifyDocument)

router.get('/performance', listPerformanceReviews)
router.post('/performance', createPerformanceReview)
router.put('/performance/:id', updatePerformanceReview)
router.delete('/performance/:id', deletePerformanceReview)
router.patch('/performance/:id/archive', archivePerformanceReview)

router.get('/recruitment', listRecruitmentCandidates)
router.post('/recruitment', createRecruitmentCandidate)
router.put('/recruitment/:id', updateRecruitmentCandidate)
router.delete('/recruitment/:id', deleteRecruitmentCandidate)
router.patch('/recruitment/:id/archive', archiveRecruitmentCandidate)

export default router
