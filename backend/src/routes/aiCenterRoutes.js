import { Router } from 'express'
import { buildModuleData, modules } from '../controllers/aiCenterController.js'

const router = Router()

router.get('/summary', (_req, res) => {
  res.json({
    modelsActive: 12,
    automationsToday: 47,
    predictionsGenerated: 328,
    availableModules: modules.length
  })
})

router.get('/module', (req, res) => {
  const { name } = req.query
  if (!name || !modules.includes(name)) {
    return res.status(404).json({ message: 'Module not found' })
  }

  return res.json(buildModuleData(name))
})

router.get('/modules', (_req, res) => {
  res.json({ modules })
})

export default router
