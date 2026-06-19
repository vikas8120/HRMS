import { Router } from 'express'
import { authRequired, allowRoles } from '../../middleware/authMiddleware.js'
import {
  getRevenueAnalyticsSummaryHandler,
  listRevenueAnalyticsHandler,
  refreshRevenueAnalyticsHandler
} from './revenueAnalytics.controller.js'

const router = Router()

router.use(authRequired)
router.use(allowRoles(['platform_admin']))

router.get('/', listRevenueAnalyticsHandler)
router.get('/summary', getRevenueAnalyticsSummaryHandler)
router.post('/refresh', refreshRevenueAnalyticsHandler)

export default router
