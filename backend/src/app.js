import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectMongo } from './config/db.js'
import authRoutes from './modules/auth/auth.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import companyRoutes from './modules/company/company.routes.js'
import billingRoutes from './modules/subscription-billing/subscriptionBilling.routes.js'
import revenueAnalyticsRoutes from './modules/revenue-analytics/revenueAnalytics.routes.js'

export const createApp = () => {
  const app = express()
  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
  const allowedOrigins = new Set(
    String(process.env.CORS_ORIGIN || defaultOrigins.join(','))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
  defaultOrigins.forEach((origin) => allowedOrigins.add(origin))

  app.use(helmet())
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true
  }))
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'hrms-backend', time: new Date().toISOString() })
  })

  app.use('/auth', authRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/super-admin/admins', adminRoutes)
  app.use('/api/super-admin/admins', adminRoutes)
  app.use('/super-admin/companies', companyRoutes)
  app.use('/api/super-admin/companies', companyRoutes)
  app.use('/super-admin', billingRoutes)
  app.use('/api/super-admin', billingRoutes)
  app.use('/super-admin/revenue-analytics', revenueAnalyticsRoutes)
  app.use('/api/super-admin/revenue-analytics', revenueAnalyticsRoutes)

  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
  })

  app.use((error, _req, res, _next) => {
    const status = error?.statusCode || error?.status || 500
    res.status(status).json({
      message: error?.message || 'Internal server error'
    })
  })

  return app
}

export const initializeApp = async () => {
  await connectMongo()
  return createApp()
}
