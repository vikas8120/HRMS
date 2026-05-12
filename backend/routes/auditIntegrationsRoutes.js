import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  exportAuditLogs,
  getAuditLogs,
  getSecuritySettings,
  seedAuditLog,
  upsertSecuritySetting
} from '../controllers/auditSecurityController.js'
import {
  connectIntegration,
  createIntegration,
  disconnectIntegration,
  listIntegrations,
  testIntegrationConnection,
  updateIntegration
} from '../controllers/integrationsController.js'

const router = Router()
router.use(protectSuperAdmin)

router.get('/audit-security/logs', getAuditLogs)
router.post('/audit-security/logs', seedAuditLog)
router.get('/audit-security/logs/export', exportAuditLogs)
router.get('/audit-security/settings', getSecuritySettings)
router.put('/audit-security/settings', upsertSecuritySetting)

router.get('/integrations', listIntegrations)
router.post('/integrations', createIntegration)
router.put('/integrations/:id', updateIntegration)
router.patch('/integrations/:id/connect', connectIntegration)
router.patch('/integrations/:id/disconnect', disconnectIntegration)
router.post('/integrations/:id/test', testIntegrationConnection)

export default router
