import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  getActiveSubscriptions,
  getActiveUsers,
  getMonthlyRevenue,
  getOverview,
  getSupportTicketSummary,
  getSystemHealth,
  getTotalCompanies,
  deleteDashboardActivity,
  getDashboardStats,
  globalSuperAdminSearch,
  listDashboardActivities,
  runHealthCheck,
  updateDashboardActivity
} from '../controllers/dashboardController.js'

const router = Router()

router.use(protectSuperAdmin)
router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/overview', getOverview)
router.get('/dashboard/total-companies', getTotalCompanies)
router.get('/dashboard/active-users', getActiveUsers)
router.get('/dashboard/active-subscriptions', getActiveSubscriptions)
router.get('/dashboard/monthly-revenue', getMonthlyRevenue)
router.get('/dashboard/support-ticket-summary', getSupportTicketSummary)
router.get('/dashboard/system-health', getSystemHealth)
router.post('/dashboard/system-health/run-check', runHealthCheck)
router.get('/dashboard/recent-activities', listDashboardActivities)
router.put('/dashboard/recent-activities/:id', updateDashboardActivity)
router.delete('/dashboard/recent-activities/:id', deleteDashboardActivity)
router.get('/search', globalSuperAdminSearch)

export default router
