import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  createAIUsageLog,
  createAutomationRule,
  getAIInsights,
  listAISettings,
  listAIUsageLogs,
  listAutomationRules,
  updateAutomationRule,
  upsertAISetting
} from '../controllers/aiCenterControllerV2.js'
import { listBackupLogs, runBackupAction, runRestoreAction } from '../controllers/backupRestoreController.js'
import { generateReport, listReportRuns } from '../controllers/reportsController.js'
import { listSystemSettings, upsertSystemSetting } from '../controllers/systemSettingsController.js'
import { getFeatureFlags, updateFeatureFlags } from '../controllers/featureManagementController.js'

const router = Router()
router.use(protectSuperAdmin)

router.get('/ai/insights', getAIInsights)
router.get('/ai/settings', listAISettings)
router.put('/ai/settings', upsertAISetting)
router.get('/ai/usage-logs', listAIUsageLogs)
router.post('/ai/usage-logs', createAIUsageLog)
router.get('/ai/automation-rules', listAutomationRules)
router.post('/ai/automation-rules', createAutomationRule)
router.put('/ai/automation-rules/:id', updateAutomationRule)

router.get('/backup/logs', listBackupLogs)
router.post('/backup/run', runBackupAction)
router.post('/backup/restore', runRestoreAction)

router.get('/reports', listReportRuns)
router.post('/reports/generate', generateReport)

router.get('/system-settings', listSystemSettings)
router.put('/system-settings', upsertSystemSetting)
router.get('/feature-management', getFeatureFlags)
router.put('/feature-management', updateFeatureFlags)

export default router
