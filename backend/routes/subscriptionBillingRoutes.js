import { Router } from 'express'
import { protectSuperAdmin } from '../middleware/authMiddleware.js'
import {
  addonCtrl,
  couponCtrl,
  generateInvoice,
  invoiceCtrl,
  markRefund,
  paymentCtrl,
  planCtrl,
  subscriptionCtrl,
  toggleAutoRenewal,
  upgradeDowngradeSubscription
} from '../controllers/subscriptionBillingController.js'

const router = Router()
router.use(protectSuperAdmin)

router.get('/subscription-plans', planCtrl.list)
router.post('/subscription-plans', planCtrl.create)
router.get('/subscription-plans/:id', planCtrl.getById)
router.put('/subscription-plans/:id', planCtrl.update)
router.delete('/subscription-plans/:id', planCtrl.remove)

router.get('/subscriptions', subscriptionCtrl.list)
router.post('/subscriptions', subscriptionCtrl.create)
router.get('/subscriptions/:id', subscriptionCtrl.getById)
router.put('/subscriptions/:id', subscriptionCtrl.update)
router.delete('/subscriptions/:id', subscriptionCtrl.remove)
router.patch('/subscriptions/:id/upgrade-downgrade', upgradeDowngradeSubscription)
router.patch('/subscriptions/:id/auto-renewal', toggleAutoRenewal)

router.get('/invoices', invoiceCtrl.list)
router.post('/invoices', invoiceCtrl.create)
router.post('/invoices/generate', generateInvoice)
router.get('/invoices/:id', invoiceCtrl.getById)
router.put('/invoices/:id', invoiceCtrl.update)
router.delete('/invoices/:id', invoiceCtrl.remove)

router.get('/payments', paymentCtrl.list)
router.post('/payments', paymentCtrl.create)
router.get('/payments/:id', paymentCtrl.getById)
router.put('/payments/:id', paymentCtrl.update)
router.delete('/payments/:id', paymentCtrl.remove)
router.patch('/payments/:id/refund', markRefund)

router.get('/coupons', couponCtrl.list)
router.post('/coupons', couponCtrl.create)
router.get('/coupons/:id', couponCtrl.getById)
router.put('/coupons/:id', couponCtrl.update)
router.delete('/coupons/:id', couponCtrl.remove)

router.get('/addons', addonCtrl.list)
router.post('/addons', addonCtrl.create)
router.get('/addons/:id', addonCtrl.getById)
router.put('/addons/:id', addonCtrl.update)
router.delete('/addons/:id', addonCtrl.remove)

export default router
