import { Router } from 'express'

const router = Router()

router.get('/summary', (_req, res) => {
  res.json({
    modelsActive: 12,
    automationsToday: 47,
    predictionsGenerated: 328,
    availableModules: 15
  })
})

export default router
