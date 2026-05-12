import { Router } from 'express'
import {
  createPlatformOverview,
  deletePlatformOverview,
  getPlatformOverviewById,
  listPlatformOverview,
  updatePlatformOverview
} from '../controllers/platformOverviewController.js'

const router = Router()

router.get('/dashboard/platform-overview', listPlatformOverview)
router.post('/dashboard/platform-overview', createPlatformOverview)
router.get('/dashboard/platform-overview/:id', getPlatformOverviewById)
router.put('/dashboard/platform-overview/:id', updatePlatformOverview)
router.delete('/dashboard/platform-overview/:id', deletePlatformOverview)

export default router
