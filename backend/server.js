import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import connectDB from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import superAdminAuthRoutes from './routes/superAdminAuthRoutes.js'
import aiCenterRoutes from './routes/aiCenterRoutes.js'
import superAdminManagementRoutes from './routes/superAdminManagementRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('Server startup error: JWT_SECRET is missing in backend/.env')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5001

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, server-side requests) with no origin header.
      if (!origin) return callback(null, true)

      const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin)
      const isLoopback = /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      if (isLocalhost || isLoopback) return callback(null, true)

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' })
})

app.use('/api/super-admin/auth', superAdminAuthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/super-admin', superAdminManagementRoutes)
app.use('/api/ai-center', aiCenterRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error(`Server startup error: ${error.message}`)
  process.exit(1)
})
