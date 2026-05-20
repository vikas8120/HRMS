import { Router } from 'express'
import { protectCompanyUser } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { requireCompanyScope } from '../middleware/companyMiddleware.js'
import { getEmployeeDashboard } from '../controllers/employeeDashboardController.js'
import {
  changeEmployeePassword,
  getEmployeeProfile,
  updateEmployeeProfile
} from '../controllers/employeeProfileController.js'
import {
  changeEmployeeSettingsPassword,
  getEmployeeSettings,
  logoutEmployeeOtherDevices,
  updateEmployeeSettings
} from '../controllers/employeeSettingsController.js'
import {
  employeeCheckIn,
  employeeCheckOut,
  getEmployeeAttendanceHistory,
  getEmployeeAttendanceMonthly,
  getEmployeeAttendanceToday,
  requestAttendanceRegularization
} from '../controllers/employeeAttendanceController.js'
import {
  applyEmployeeLeave,
  cancelEmployeeLeave,
  getEmployeeLeaveBalance,
  getEmployeeLeaveById,
  getEmployeeLeavePolicy,
  getEmployeeLeaves,
  updateEmployeeLeave
} from '../controllers/employeeLeaveController.js'
import {
  downloadEmployeePayslipPdf,
  getEmployeeLatestPayslip,
  getEmployeePayrollById,
  getEmployeePayrollHistory
} from '../controllers/employeePayrollController.js'
import uploadDocumentFile from '../middleware/uploadMiddleware.js'
import {
  deleteEmployeeDocument,
  getEmployeeDocumentById,
  getEmployeeDocuments,
  updateEmployeeDocument,
  uploadEmployeeDocument
} from '../controllers/employeeDocumentController.js'
import {
  addEmployeeTaskComment,
  getEmployeeTaskById,
  getEmployeeTasks,
  updateEmployeeTaskStatus
} from '../controllers/employeeTaskController.js'
import {
  getEmployeeAnnouncementById,
  getEmployeeAnnouncements,
  markEmployeeAnnouncementRead
} from '../controllers/employeeAnnouncementController.js'
import {
  addEmployeeTicketMessage,
  closeEmployeeTicket,
  createEmployeeTicket,
  getEmployeeTicketById,
  getEmployeeTicketCategories,
  getEmployeeTickets,
  reopenEmployeeTicket
} from '../controllers/employeeTicketController.js'
import {
  deleteEmployeeNotification,
  getEmployeeNotifications,
  markAllEmployeeNotificationsRead,
  markEmployeeNotificationRead
} from '../controllers/employeeNotificationController.js'
import {
  downloadEmployeePerformanceReport,
  getEmployeeAppraisalHistory,
  getEmployeePerformanceFeedback,
  getEmployeePerformanceGoalById,
  getEmployeePerformanceGoals,
  getEmployeePerformanceOverview,
  submitEmployeeSelfReview,
  updateEmployeePerformanceGoalProgress
} from '../controllers/employeePerformanceController.js'

const router = Router()

router.use(protectCompanyUser, requireRole('employee'), requireCompanyScope)

router.get('/dashboard', getEmployeeDashboard)
router.get('/attendance/today', getEmployeeAttendanceToday)
router.post('/attendance/check-in', employeeCheckIn)
router.post('/attendance/check-out', employeeCheckOut)
router.get('/attendance/monthly', getEmployeeAttendanceMonthly)
router.get('/attendance/history', getEmployeeAttendanceHistory)
router.post('/attendance/regularization-request', requestAttendanceRegularization)
router.get('/leaves', getEmployeeLeaves)
router.post('/leaves', applyEmployeeLeave)
router.get('/leaves/balance', getEmployeeLeaveBalance)
router.get('/leaves/policy', getEmployeeLeavePolicy)
router.get('/leaves/:id', getEmployeeLeaveById)
router.put('/leaves/:id', updateEmployeeLeave)
router.delete('/leaves/:id', cancelEmployeeLeave)
router.get('/payroll', getEmployeePayrollHistory)
router.get('/payroll/latest', getEmployeeLatestPayslip)
router.get('/payroll/:id', getEmployeePayrollById)
router.get('/payroll/:id/payslip', downloadEmployeePayslipPdf)
router.get('/documents', getEmployeeDocuments)
router.post('/documents', uploadDocumentFile, uploadEmployeeDocument)
router.get('/documents/:id', getEmployeeDocumentById)
router.put('/documents/:id', uploadDocumentFile, updateEmployeeDocument)
router.delete('/documents/:id', deleteEmployeeDocument)
router.get('/tasks', getEmployeeTasks)
router.get('/tasks/:id', getEmployeeTaskById)
router.patch('/tasks/:id/status', updateEmployeeTaskStatus)
router.post('/tasks/:id/comments', uploadDocumentFile, addEmployeeTaskComment)
router.get('/announcements', getEmployeeAnnouncements)
router.get('/announcements/:id', getEmployeeAnnouncementById)
router.patch('/announcements/:id/read', markEmployeeAnnouncementRead)
router.get('/tickets/categories', getEmployeeTicketCategories)
router.get('/tickets', getEmployeeTickets)
router.post('/tickets', uploadDocumentFile, createEmployeeTicket)
router.get('/tickets/:id', getEmployeeTicketById)
router.post('/tickets/:id/messages', uploadDocumentFile, addEmployeeTicketMessage)
router.patch('/tickets/:id/close', closeEmployeeTicket)
router.patch('/tickets/:id/reopen', reopenEmployeeTicket)
router.get('/notifications', getEmployeeNotifications)
router.patch('/notifications/:id/read', markEmployeeNotificationRead)
router.patch('/notifications/read-all', markAllEmployeeNotificationsRead)
router.delete('/notifications/:id', deleteEmployeeNotification)
router.get('/performance', getEmployeePerformanceOverview)
router.get('/performance/goals', getEmployeePerformanceGoals)
router.get('/performance/goals/:id', getEmployeePerformanceGoalById)
router.patch('/performance/goals/:id/progress', updateEmployeePerformanceGoalProgress)
router.get('/performance/feedback', getEmployeePerformanceFeedback)
router.get('/performance/appraisals', getEmployeeAppraisalHistory)
router.post('/performance/self-review', submitEmployeeSelfReview)
router.get('/performance/report', downloadEmployeePerformanceReport)
router.get('/profile', getEmployeeProfile)
router.put('/profile', updateEmployeeProfile)
router.put('/profile/change-password', changeEmployeePassword)
router.get('/settings', getEmployeeSettings)
router.put('/settings', updateEmployeeSettings)
router.put('/change-password', changeEmployeeSettingsPassword)
router.post('/settings/logout-other-devices', logoutEmployeeOtherDevices)

export default router
