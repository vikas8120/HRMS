import { Router } from 'express'
import {
  createDashboardWidget,
  deleteDashboardWidget,
  getDashboardWidgetById,
  listDashboardWidgets,
  updateDashboardWidget
} from '../controllers/dashboardWidgetController.js'

const router = Router()

router.get('/dashboard/widgets/:sectionKey', listDashboardWidgets)
router.post('/dashboard/widgets/:sectionKey', createDashboardWidget)
router.get('/dashboard/widgets/:sectionKey/:id', getDashboardWidgetById)
router.put('/dashboard/widgets/:sectionKey/:id', updateDashboardWidget)
router.delete('/dashboard/widgets/:sectionKey/:id', deleteDashboardWidget)

export default router
