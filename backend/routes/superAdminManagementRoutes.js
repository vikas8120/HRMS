import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  getCompanyAdmins,
  createCompanyAdmin,
  getCompanyAdminById,
  updateCompanyAdmin,
  deleteCompanyAdmin,
  updateCompanyAdminStatus,
  resetCompanyAdminPassword,
  assignCompaniesToAdmin
} from '../controllers/companyAdminController.js'
import {
  getCompaniesDropdown,
  getAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  updateAdminStatus,
  resetAdminPassword
} from '../controllers/superAdminAdminController.js'
import {
  getAdminAccessLogs,
  getAdminActivityLogs,
  getRoles,
  createRole,
  updateRolePermissions,
  assignRoleToAdmin
} from '../controllers/adminGovernanceController.js'
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  addBranch,
  updateBranch,
  deleteBranch,
  updateBranding,
  updateDomain,
  getCompanyActivityLogs,
  listTenantCompanies
} from '../controllers/companyManagementController.js'
import subscriptionBillingRoutes from './subscriptionBillingRoutes.js'
import globalSupportRoutes from './globalSupportRoutes.js'
import auditIntegrationsRoutes from './auditIntegrationsRoutes.js'
import aiBackupReportsSettingsRoutes from './aiBackupReportsSettingsRoutes.js'
import platformOverviewRoutes from './platformOverviewRoutes.js'
import dashboardWidgetRoutes from './dashboardWidgetRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'

const router = Router()

router.use(protectSuperAdmin)

router.get('/companies/dropdown', getCompaniesDropdown)

router.get('/admins', getAdmins)
router.post('/admins', createAdmin)
router.get('/admins/:id', getAdminById)
router.put('/admins/:id', updateAdmin)
router.delete('/admins/:id', deleteAdmin)
router.patch('/admins/:id/status', updateAdminStatus)
router.patch('/admins/:id/reset-password', resetAdminPassword)

router.get('/company-admins', getCompanyAdmins)
router.post('/company-admins', createCompanyAdmin)
router.get('/company-admins/:id', getCompanyAdminById)
router.put('/company-admins/:id', updateCompanyAdmin)
router.delete('/company-admins/:id', deleteCompanyAdmin)
router.patch('/company-admins/:id/status', updateCompanyAdminStatus)
router.patch('/company-admins/:id/reset-password', resetCompanyAdminPassword)
router.patch('/company-admins/:id/assign-companies', assignCompaniesToAdmin)

router.get('/companies', getCompanies)
router.post('/companies', createCompany)
router.get('/companies/:id', getCompanyById)
router.put('/companies/:id', updateCompany)
router.delete('/companies/:id', deleteCompany)
router.patch('/companies/:id/status', updateCompanyStatus)
router.post('/companies/:id/branches', addBranch)
router.put('/companies/:id/branches/:branchId', updateBranch)
router.delete('/companies/:id/branches/:branchId', deleteBranch)
router.put('/companies/:id/branding', updateBranding)
router.put('/companies/:id/domain', updateDomain)
router.get('/companies/:id/activity-logs', getCompanyActivityLogs)

router.get('/tenant-companies', listTenantCompanies)

router.get('/admin-logs/access', getAdminAccessLogs)
router.get('/admin-logs/activity', getAdminActivityLogs)

router.get('/roles', getRoles)
router.post('/roles', createRole)
router.put('/roles/:id/permissions', updateRolePermissions)
router.patch('/assign-role', assignRoleToAdmin)

router.use('/', subscriptionBillingRoutes)
router.use('/', globalSupportRoutes)
router.use('/', auditIntegrationsRoutes)
router.use('/', aiBackupReportsSettingsRoutes)
router.use('/', platformOverviewRoutes)
router.use('/', dashboardWidgetRoutes)
router.use('/', dashboardRoutes)

export default router
