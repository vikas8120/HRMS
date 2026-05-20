import { Router } from 'express'
import { protectCompanyUser } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { requireCompanyScope } from '../middleware/companyMiddleware.js'
import { getManagerDashboard, getManagerRecentActivities } from '../controllers/managerDashboardController.js'
import { getManagerTeam, getManagerTeamMemberById, getManagerTeamMemberDetails } from '../controllers/managerTeamController.js'
import {
  applyManagerLeave,
  approveManagerLeave,
  getManagerLeaveById,
  getManagerLeaves,
  getMyManagerLeaves,
  getManagerPendingLeaves,
  rejectManagerLeave
} from '../controllers/managerLeaveController.js'
import {
  getManagerAttendance,
  getManagerAttendanceAlerts,
  getManagerAttendanceReports,
  getManagerAttendanceToday,
  getManagerEmployeeAttendance,
  getManagerMyAttendanceToday,
  managerPunchInAttendance,
  managerPunchOutAttendance
} from '../controllers/managerAttendanceController.js'
import {
  addManagerTaskComment,
  createManagerTask,
  deleteManagerTask,
  getManagerTaskById,
  getManagerTasks,
  reassignManagerTask,
  updateManagerTask,
  updateManagerTaskStatus
} from '../controllers/managerTaskController.js'
import {
  createManagerPerformanceReview,
  deleteManagerPerformanceReview,
  getManagerPerformanceByEmployee,
  getManagerPerformanceDashboard,
  getManagerPerformanceReviews,
  updateManagerPerformanceReview
} from '../controllers/managerPerformanceController.js'
import {
  exportManagerReportExcel,
  exportManagerReportPdf,
  getManagerAttendanceReport,
  getManagerCustomReport,
  getManagerLeaveReport,
  getManagerPerformanceReport,
  getManagerTaskReport
} from '../controllers/managerReportsController.js'
import {
  addManagerRequestComment,
  closeManagerRequest,
  createManagerRequest,
  deleteManagerRequest,
  getManagerRequestById,
  getManagerRequests,
  updateManagerRequest,
  uploadManagerRequestDocument
} from '../controllers/managerRequestsController.js'
import {
  deleteManagerNotification,
  getManagerNotifications,
  markAllManagerNotificationsRead,
  markManagerNotificationRead
} from '../controllers/managerNotificationController.js'
import {
  addManagerMeetingNotes,
  createManagerMeeting,
  deleteManagerMeeting,
  getManagerMeetingById,
  getManagerMeetings,
  updateManagerMeeting
} from '../controllers/managerMeetingController.js'
import {
  createManagerBonusRecommendation,
  getManagerPayrollStatus,
  getManagerPayrollTeamSummary
} from '../controllers/managerPayrollController.js'
import uploadDocumentFile from '../middleware/uploadMiddleware.js'
import {
  createManagerDocumentRequest,
  deleteManagerDocument,
  getManagerDocumentById,
  getManagerDocuments,
  getManagerDocumentRequests,
  uploadManagerDocument
} from '../controllers/managerDocumentController.js'
import {
  createManagerAnnouncement,
  createManagerMessage,
  deleteManagerAnnouncement,
  deleteManagerMessage,
  getManagerAnnouncements,
  getManagerMessages,
  getManagerMessageThreadById,
  replyManagerMessageThread,
  updateManagerAnnouncement
} from '../controllers/managerCommunicationController.js'
import {
  changeManagerPassword,
  getManagerLoginActivity,
  getManagerProfile,
  logoutManagerOtherDevices,
  uploadManagerProfileImage,
  updateManagerProfile
} from '../controllers/managerProfileController.js'
import {
  closeManagerSupportTicket,
  createManagerSupportTicket,
  getManagerSupportFaqs,
  getManagerSupportTicketById,
  getManagerSupportTickets,
  replyManagerSupportTicket
} from '../controllers/managerSupportController.js'

const router = Router()

router.use(protectCompanyUser, requireRole('manager'), requireCompanyScope)

router.get('/dashboard', getManagerDashboard)
router.get('/dashboard/recent-activities', getManagerRecentActivities)
router.get('/team', getManagerTeam)
router.get('/team/:employeeId/details', getManagerTeamMemberDetails)
router.get('/team/:employeeId', getManagerTeamMemberById)
router.get('/leaves', getManagerLeaves)
router.get('/leaves/my', getMyManagerLeaves)
router.post('/leaves/apply', applyManagerLeave)
router.get('/leaves/pending', getManagerPendingLeaves)
router.get('/leaves/:leaveId', getManagerLeaveById)
router.put('/leaves/:leaveId/approve', approveManagerLeave)
router.put('/leaves/:leaveId/reject', rejectManagerLeave)
router.get('/attendance', getManagerAttendance)
router.get('/attendance/today', getManagerAttendanceToday)
router.get('/attendance/my-today', getManagerMyAttendanceToday)
router.post('/attendance/punch-in', managerPunchInAttendance)
router.post('/attendance/punch-out', managerPunchOutAttendance)
router.get('/attendance/reports', getManagerAttendanceReports)
router.get('/attendance/alerts', getManagerAttendanceAlerts)
router.get('/attendance/:employeeId', getManagerEmployeeAttendance)
router.post('/tasks', createManagerTask)
router.get('/tasks', getManagerTasks)
router.get('/tasks/:taskId', getManagerTaskById)
router.put('/tasks/:taskId', updateManagerTask)
router.delete('/tasks/:taskId', deleteManagerTask)
router.post('/tasks/:taskId/comments', addManagerTaskComment)
router.put('/tasks/:taskId/status', updateManagerTaskStatus)
router.put('/tasks/:taskId/reassign', reassignManagerTask)
router.post('/performance', createManagerPerformanceReview)
router.get('/performance', getManagerPerformanceReviews)
router.get('/performance/dashboard', getManagerPerformanceDashboard)
router.get('/performance/:employeeId', getManagerPerformanceByEmployee)
router.put('/performance/:reviewId', updateManagerPerformanceReview)
router.delete('/performance/:reviewId', deleteManagerPerformanceReview)
router.get('/reports/attendance', getManagerAttendanceReport)
router.get('/reports/leaves', getManagerLeaveReport)
router.get('/reports/tasks', getManagerTaskReport)
router.get('/reports/performance', getManagerPerformanceReport)
router.post('/reports/custom', getManagerCustomReport)
router.get('/reports/export/pdf', exportManagerReportPdf)
router.get('/reports/export/excel', exportManagerReportExcel)
router.post('/requests', createManagerRequest)
router.get('/requests', getManagerRequests)
router.get('/requests/:requestId', getManagerRequestById)
router.put('/requests/:requestId', updateManagerRequest)
router.delete('/requests/:requestId', deleteManagerRequest)
router.post('/requests/:requestId/comments', addManagerRequestComment)
router.post('/requests/:requestId/upload', uploadDocumentFile, uploadManagerRequestDocument)
router.put('/requests/:requestId/close', closeManagerRequest)
router.get('/notifications', getManagerNotifications)
router.put('/notifications/mark-all-read', markAllManagerNotificationsRead)
router.put('/notifications/:notificationId/read', markManagerNotificationRead)
router.delete('/notifications/:notificationId', deleteManagerNotification)
router.post('/meetings', createManagerMeeting)
router.get('/meetings', getManagerMeetings)
router.get('/meetings/:meetingId', getManagerMeetingById)
router.put('/meetings/:meetingId', updateManagerMeeting)
router.delete('/meetings/:meetingId', deleteManagerMeeting)
router.post('/meetings/:meetingId/notes', addManagerMeetingNotes)
router.get('/payroll/team-summary', getManagerPayrollTeamSummary)
router.get('/payroll/status', getManagerPayrollStatus)
router.post('/payroll/bonus-recommendation', createManagerBonusRecommendation)
router.get('/documents', getManagerDocuments)
router.post('/documents/upload', uploadDocumentFile, uploadManagerDocument)
router.post('/documents/request', createManagerDocumentRequest)
router.get('/documents/requests', getManagerDocumentRequests)
router.get('/documents/:documentId', getManagerDocumentById)
router.delete('/documents/:documentId', deleteManagerDocument)
router.post('/messages', createManagerMessage)
router.get('/messages', getManagerMessages)
router.post('/messages/:threadId/reply', replyManagerMessageThread)
router.get('/messages/:threadId', getManagerMessageThreadById)
router.delete('/messages/:messageId', deleteManagerMessage)
router.post('/announcements', createManagerAnnouncement)
router.get('/announcements', getManagerAnnouncements)
router.put('/announcements/:announcementId', updateManagerAnnouncement)
router.delete('/announcements/:announcementId', deleteManagerAnnouncement)
router.get('/profile', getManagerProfile)
router.put('/profile', updateManagerProfile)
router.post('/profile/upload-image', uploadDocumentFile, uploadManagerProfileImage)
router.put('/profile/change-password', changeManagerPassword)
router.get('/profile/login-activity', getManagerLoginActivity)
router.post('/profile/logout-other-devices', logoutManagerOtherDevices)
router.post('/support/tickets', uploadDocumentFile, createManagerSupportTicket)
router.get('/support/tickets', getManagerSupportTickets)
router.get('/support/tickets/:ticketId', getManagerSupportTicketById)
router.post('/support/tickets/:ticketId/reply', uploadDocumentFile, replyManagerSupportTicket)
router.put('/support/tickets/:ticketId/close', closeManagerSupportTicket)
router.get('/support/faqs', getManagerSupportFaqs)

export default router
