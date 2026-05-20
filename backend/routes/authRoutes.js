import { Router } from 'express'
import { login, managerLogin, me } from '../controllers/authController.js'

const router = Router()

router.post('/login', login)
router.post('/manager/login', managerLogin)
router.get('/me', me)

export default router
