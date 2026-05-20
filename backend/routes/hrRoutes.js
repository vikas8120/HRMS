import { Router } from 'express'
import { getAdminDashboard } from '../controllers/adminDashboardController.js'
import { protectCompanyUser } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { requireCompanyScope } from '../middleware/companyMiddleware.js'

const router = Router()

router.use(protectCompanyUser, requireRole('hr'), requireCompanyScope)

router.get('/dashboard', getAdminDashboard)

export default router

