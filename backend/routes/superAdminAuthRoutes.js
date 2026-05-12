import { Router } from 'express'
import {
  loginSuperAdmin,
  getCurrentSuperAdmin,
  logoutSuperAdmin
} from '../controllers/superAdminAuthController.js'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', loginSuperAdmin)
router.get('/me', protectSuperAdmin, getCurrentSuperAdmin)
router.post('/logout', protectSuperAdmin, logoutSuperAdmin)

export default router
