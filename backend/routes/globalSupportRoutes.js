import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  blockUnblockUser,
  bulkExportUsers,
  bulkImportUsers,
  createGlobalUser,
  forceLogout,
  getActiveSessions,
  getDeviceTracking,
  getFailedAttempts,
  getLoginHistory,
  listGlobalUsers,
  updateGlobalUser
} from '../controllers/globalUsersController.js'
import {
  addInternalNote,
  addTicketMessage,
  assignTicket,
  createAgent,
  createCategory,
  createTicket,
  getTicketMessages,
  listAgents,
  listCategories,
  listTickets,
  resolveTicket,
  setTicketPriority,
  setTicketSla,
  updateTicket
} from '../controllers/supportCenterController.js'

const router = Router()
router.use(protectSuperAdmin)

router.get('/global-users', listGlobalUsers)
router.post('/global-users', createGlobalUser)
router.put('/global-users/:id', updateGlobalUser)
router.patch('/global-users/:id/status', blockUnblockUser)
router.patch('/global-users/:id/force-logout', forceLogout)
router.get('/global-users/login-history', getLoginHistory)
router.get('/global-users/active-sessions', getActiveSessions)
router.get('/global-users/failed-attempts', getFailedAttempts)
router.get('/global-users/device-tracking', getDeviceTracking)
router.post('/global-users/bulk-import', bulkImportUsers)
router.get('/global-users/bulk-export', bulkExportUsers)

router.get('/support/tickets', listTickets)
router.post('/support/tickets', createTicket)
router.put('/support/tickets/:id', updateTicket)
router.patch('/support/tickets/:id/assign', assignTicket)
router.patch('/support/tickets/:id/priority', setTicketPriority)
router.patch('/support/tickets/:id/sla', setTicketSla)
router.patch('/support/tickets/:id/resolve', resolveTicket)
router.post('/support/tickets/:id/messages', addTicketMessage)
router.get('/support/tickets/:id/messages', getTicketMessages)
router.post('/support/tickets/:id/internal-notes', addInternalNote)

router.get('/support/categories', listCategories)
router.post('/support/categories', createCategory)
router.get('/support/agents', listAgents)
router.post('/support/agents', createAgent)

export default router
